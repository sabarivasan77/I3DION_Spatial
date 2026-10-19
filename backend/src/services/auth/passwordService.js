/**
 * Enterprise Credential Storage & Policy Service (Annex A1)
 * Enforces Argon2id hashing, timing equalization, upgrade-on-login from bcrypt,
 * length policy (12-128 chars), and k-anonymity breached-password checks.
 */

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

let argon2 = null;
try {
  const mod = await import('argon2');
  argon2 = mod.default || mod;
} catch (err) {
  console.warn('[passwordService] Native argon2 addon not available in runtime environment. Using pure-JS bcryptjs.');
}

// Annex A1 parameters: memory=64MiB (65536 KiB), iterations=3, parallelism=1
export const ARGON2_OPTIONS = argon2 ? {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} : null;

// Pre-computed dummy hashes for constant-time timing equalization
let DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c29tZXJhbmRvbXNhbHQxNg$5vYVlW7ZlP7Yl9K8J6H5G4F3E2D1C0B9A8Z7Y6X5W4V';
const DUMMY_BCRYPT_HASH = '$2b$12$e8xL4BqP9K3A1Z7Y6X5W4Ve8xL4BqP9K3A1Z7Y6X5W4Ve8xL4BqP9';

// Initialize dummy hash asynchronously to ensure real matching parameters
(async () => {
  if (argon2 && ARGON2_OPTIONS) {
    try {
      DUMMY_HASH = await argon2.hash('dummy_timing_equalization_string', ARGON2_OPTIONS);
    } catch (err) {
      // Keep fallback dummy hash
    }
  }
})();

export const passwordService = {
  /**
   * Hashes a password using Argon2id when available, falling back to pure-JS bcryptjs.
   */
  async hash(password) {
    if (argon2 && ARGON2_OPTIONS) {
      try {
        return await argon2.hash(password, ARGON2_OPTIONS);
      } catch (err) {
        console.warn('Argon2 hashing failed, falling back to bcryptjs:', err.message);
      }
    }
    return bcrypt.hash(password, 12);
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
      if (argon2) {
        await argon2.verify(DUMMY_HASH, password).catch(() => false);
      } else {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH).catch(() => false);
      }
      return { isValid: false, needsUpgrade: false };
    }

    try {
      if (storedHash.startsWith('$argon2')) {
        if (argon2) {
          const isValid = await argon2.verify(storedHash, password);
          const needsUpgrade = isValid && argon2.needsRehash ? argon2.needsRehash(storedHash, ARGON2_OPTIONS) : false;
          return { isValid, needsUpgrade };
        }
        return { isValid: false, needsUpgrade: false };
      }

      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        const isValid = await bcrypt.compare(password, storedHash);
        // Valid bcrypt password can be upgraded to Argon2id on login if argon2 available
        return { isValid, needsUpgrade: Boolean(isValid && argon2) };
      }

      // Unknown or malformed hash
      if (argon2) {
        await argon2.verify(DUMMY_HASH, password).catch(() => false);
      } else {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH).catch(() => false);
      }
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
