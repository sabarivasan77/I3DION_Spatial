/**
 * Enterprise Credential Storage & Policy Service (Annex A1)
 * Enforces Argon2id hashing, timing equalization, upgrade-on-login from bcrypt,
 * length policy (12-128 chars), and k-anonymity breached-password checks.
 */

import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// Annex A1 parameters: memory=64MiB (65536 KiB), iterations=3, parallelism=1
export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

// Pre-computed dummy Argon2id hash for constant-time timing equalization
let DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c29tZXJhbmRvbXNhbHQxNg$5vYVlW7ZlP7Yl9K8J6H5G4F3E2D1C0B9A8Z7Y6X5W4V';

// Initialize dummy hash asynchronously to ensure real matching parameters
(async () => {
  try {
    DUMMY_HASH = await argon2.hash('dummy_timing_equalization_string', ARGON2_OPTIONS);
  } catch (err) {
    // Keep fallback dummy hash
  }
})();

export const passwordService = {
  /**
   * Hashes a password using Argon2id with 64 MiB memory, 3 iterations.
   */
  async hash(password) {
    return argon2.hash(password, ARGON2_OPTIONS);
  },

  /**
   * Verifies a password against a hash with constant-time timing equalization.
   * Supports upgrade-on-login for legacy bcrypt hashes.
   *
   * @param {string|null} storedHash
   * @param {string} password
   * @returns {Promise<{ isValid: boolean, needsUpgrade: boolean }>}
   */
  async verify(storedHash, password) {
    if (!storedHash) {
      // Always run hash verification even if user does not exist to equalize timing
      await argon2.verify(DUMMY_HASH, password).catch(() => false);
      return { isValid: false, needsUpgrade: false };
    }

    try {
      if (storedHash.startsWith('$argon2')) {
        const isValid = await argon2.verify(storedHash, password);
        const needsUpgrade = isValid && argon2.needsRehash(storedHash, ARGON2_OPTIONS);
        return { isValid, needsUpgrade };
      }

      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        const isValid = await bcrypt.compare(password, storedHash);
        // Valid bcrypt password MUST be upgraded to Argon2id on login
        return { isValid, needsUpgrade: isValid };
      }

      // Unknown or malformed hash
      await argon2.verify(DUMMY_HASH, password).catch(() => false);
      return { isValid: false, needsUpgrade: false };
    } catch (err) {
      return { isValid: false, needsUpgrade: false };
    }
  },

  /**
   * Validates password against enterprise policy:
   * - 12 to 128 characters
   * - Must not equal or closely contain email local part or name
   * - Must not appear in breached password databases (k-anonymity check)
   */
  async validatePolicy(password, { email = '', name = '' } = {}) {
    if (typeof password !== 'string') {
      return { valid: false, reason: 'Password must be a string' };
    }

    if (password.length < 12) {
      return { valid: false, reason: 'Password must be at least 12 characters long' };
    }

    if (password.length > 128) {
      return { valid: false, reason: 'Password must not exceed 128 characters' };
    }

    const lowerPw = password.toLowerCase();

    if (email) {
      const emailLocal = email.split('@')[0].toLowerCase();
      if (emailLocal.length >= 3 && lowerPw.includes(emailLocal)) {
        return { valid: false, reason: 'Password must not contain your email username' };
      }
    }

    if (name) {
      const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length >= 3);
      for (const part of nameParts) {
        if (lowerPw.includes(part)) {
          return { valid: false, reason: 'Password must not contain your name' };
        }
      }
    }

    // k-Anonymity Breached Password Check (HaveIBeenPwned range query)
    const isBreached = await this.checkBreachedPassword(password);
    if (isBreached) {
      return {
        valid: false,
        reason: 'This password has been identified in a public data breach. Please choose a stronger, unique password.'
      };
    }

    return { valid: true };
  },

  /**
   * Performs k-anonymity range check against HaveIBeenPwned API.
   * Sends ONLY the first 5 SHA-1 hash chars; evaluates remainder locally.
   */
  async checkBreachedPassword(password) {
    try {
      const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'I3DION-Spatial-Security-Engine' }
      });
      clearTimeout(timeout);

      if (!res.ok) return false; // Fail open if API is unreachable

      const text = await res.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const [hashSuffix, count] = line.trim().split(':');
        if (hashSuffix === suffix && parseInt(count, 10) > 0) {
          return true; // Password found in breach dataset
        }
      }

      return false;
    } catch (err) {
      // In case of timeout or offline test environments, fail-open gracefully
      return false;
    }
  }
};
