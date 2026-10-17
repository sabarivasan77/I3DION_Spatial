/**
 * TOTP Multi-Factor Authentication Service (RFC 6238)
 * Provides setup, QR code generation, TOTP verification, scratch codes,
 * and AES-256-GCM encryption of secrets at rest.
 */

import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import { query } from '../../db/pool.js';
import { config } from '../../config.js';

// Derive AES-256 key from server secret
const MFA_ENCRYPTION_KEY = crypto.scryptSync(config.jwtSecret || 'i3dion_mfa_master_key_fallback_128', 'i3dion_mfa_salt', 32);

function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MFA_ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptSecret(encryptedPayload) {
  const [ivHex, tagHex, encryptedHex] = encryptedPayload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MFA_ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export const mfaService = {
  /**
   * Initializes TOTP enrollment: generates secret, QR code, and scratch codes.
   */
  async generateMfaSetup(userId, email) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'I3DION Spatial', label: email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate 8 single-use scratch codes
    const plainScratchCodes = [];
    const hashedScratchCodes = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
      plainScratchCodes.push(code);
      hashedScratchCodes.push(crypto.createHash('sha256').update(code).digest('hex'));
    }

    const encryptedSecret = encryptSecret(secret);

    // Save provisional setup in user_mfa (is_enabled stays false until verified)
    await query(
      `INSERT INTO user_mfa (user_id, secret_encrypted, is_enabled, scratch_codes, updated_at)
       VALUES ($1, $2, false, $3, now())
       ON CONFLICT (user_id) DO UPDATE
       SET secret_encrypted = EXCLUDED.secret_encrypted,
           is_enabled = false,
           scratch_codes = EXCLUDED.scratch_codes,
           updated_at = now()`,
      [userId, encryptedSecret, JSON.stringify(hashedScratchCodes)]
    );

    return {
      secret,
      qrCodeDataUrl,
      otpauthUrl,
      scratchCodes: plainScratchCodes
    };
  },

  /**
   * Confirms TOTP setup by verifying the first code submitted by user.
   */
  async confirmMfaSetup(userId, token) {
    const res = await query(`SELECT secret_encrypted, is_enabled FROM user_mfa WHERE user_id = $1`, [userId]);
    if (res.rows.length === 0) {
      throw new Error('MFA setup not initialized for this user');
    }

    const { secret_encrypted } = res.rows[0];
    const plainSecret = decryptSecret(secret_encrypted);

    let isValid = false;
    try {
      const checkResult = verifySync({ token: token.trim(), secret: plainSecret });
      isValid = checkResult && checkResult.valid === true;
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      const err = new Error('Invalid authentication code. Please try again.');
      err.status = 400;
      throw err;
    }

    await query(`UPDATE user_mfa SET is_enabled = true, updated_at = now() WHERE user_id = $1`, [userId]);
    return { enabled: true };
  },

  /**
   * Verifies an MFA token or single-use scratch code during authentication.
   */
  async verifyMfa(userId, code) {
    const res = await query(`SELECT secret_encrypted, is_enabled, scratch_codes FROM user_mfa WHERE user_id = $1`, [userId]);
    if (res.rows.length === 0 || !res.rows[0].is_enabled) {
      // MFA not enabled for user
      return { verified: true, mfaRequired: false };
    }

    const { secret_encrypted, scratch_codes } = res.rows[0];
    const plainSecret = decryptSecret(secret_encrypted);

    // 1. Try TOTP code check
    let isTotpValid = false;
    try {
      const checkResult = verifySync({ token: code.trim(), secret: plainSecret });
      isTotpValid = checkResult && checkResult.valid === true;
    } catch (e) {
      isTotpValid = false;
    }

    if (isTotpValid) {
      return { verified: true, mfaRequired: true, usedScratchCode: false };
    }

    // 2. Check if it matches a scratch recovery code
    const hashedCode = crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
    const remainingCodes = (scratch_codes || []).filter(c => c !== hashedCode);

    if (remainingCodes.length < scratch_codes.length) {
      // Valid scratch code found! Consume it atomically
      await query(`UPDATE user_mfa SET scratch_codes = $1, updated_at = now() WHERE user_id = $2`, [
        JSON.stringify(remainingCodes),
        userId
      ]);
      return { verified: true, mfaRequired: true, usedScratchCode: true };
    }

    return { verified: false, mfaRequired: true };
  },

  /**
   * Checks if MFA is required and enabled for a user.
   */
  async isMfaEnabled(userId) {
    const res = await query(`SELECT is_enabled FROM user_mfa WHERE user_id = $1`, [userId]);
    return res.rows.length > 0 && res.rows[0].is_enabled === true;
  },

  /**
   * Disables MFA for a user (requires authentication or admin action).
   */
  async disableMfa(userId) {
    await query(`DELETE FROM user_mfa WHERE user_id = $1`, [userId]);
  }
};
