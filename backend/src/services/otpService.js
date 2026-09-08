import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { ApiError } from '../utils/errors.js';

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export class OtpService {
  /**
   * Generate a 6-digit OTP code and store its hash in the database
   */
  async generateOtp({ userId = null, email, purpose }) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Rate limiting check: max 5 active unexpired OTPs per 10 min window
    const rateCheck = await query(
      `SELECT count(*) as count 
       FROM otp_verifications 
       WHERE email = $1 AND purpose = $2 AND created_at > (now() - interval '10 minutes')`,
      [normalizedEmail, purpose]
    );

    if (parseInt(rateCheck.rows[0].count, 10) >= 5) {
      throw new ApiError(429, 'Too many verification attempts. Please wait 10 minutes before requesting a new code.');
    }

    // 2. Generate 6-digit code
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Invalidate previous pending OTPs for same email & purpose
    await query(
      `UPDATE otp_verifications SET expires_at = now() WHERE email = $1 AND purpose = $2 AND verified_at IS NULL`,
      [normalizedEmail, purpose]
    );

    // 4. Save new OTP hash
    const inserted = await query(
      `INSERT INTO otp_verifications (user_id, email, purpose, otp_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, expires_at`,
      [userId, normalizedEmail, purpose, otpHash, expiresAt]
    );

    return {
      otpId: inserted.rows[0].id,
      expiresAt: inserted.rows[0].expires_at,
      code: rawOtp, // Returned only for email delivery dispatch, NEVER saved raw
    };
  }

  /**
   * Verify an OTP code against stored hash
   */
  async verifyOtp({ email, purpose, code }) {
    const normalizedEmail = email.toLowerCase().trim();
    const inputHash = hashOtp(code.trim());

    // 1. Find active OTP
    const { rows } = await query(
      `SELECT * FROM otp_verifications
       WHERE email = $1 AND purpose = $2 AND verified_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, purpose]
    );

    const record = rows[0];
    if (!record) {
      throw new ApiError(400, 'Verification code has expired or is invalid. Please request a new code.');
    }

    // 2. Check maximum attempts
    if (record.attempts_count >= record.max_attempts) {
      await query(`UPDATE otp_verifications SET expires_at = now() WHERE id = $1`, [record.id]);
      throw new ApiError(429, 'Maximum verification attempts exceeded. Code invalidated.');
    }

    // 3. Compare hash
    if (record.otp_hash !== inputHash) {
      await query(`UPDATE otp_verifications SET attempts_count = attempts_count + 1 WHERE id = $1`, [record.id]);
      throw new ApiError(400, 'Invalid verification code. Please check and try again.');
    }

    // 4. Mark verified & return success
    await query(`UPDATE otp_verifications SET verified_at = now() WHERE id = $1`, [record.id]);

    return {
      success: true,
      userId: record.user_id,
      email: record.email,
      purpose: record.purpose,
    };
  }
}

export const otpService = new OtpService();
