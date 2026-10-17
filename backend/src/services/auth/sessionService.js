/**
 * Dual-Token Session & Rotation Engine (Annex A2)
 * Manages 10-minute JWT access tokens and sliding 14-day rotating refresh tokens
 * with automatic reuse detection, family-wide revocation, and token_version synchronization.
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool, query, withTransaction } from '../../db/pool.js';
import { config } from '../../config.js';

const ACCESS_TOKEN_TTL_SEC = 10 * 60; // 10 minutes
const REFRESH_TOKEN_SLIDING_DAYS = 14;

export const sessionService = {
  /**
   * Hashes a raw refresh token using SHA-256 for secure storage.
   */
  hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },

  /**
   * Hashes user agent for session fingerprinting.
   */
  hashUserAgent(ua = '') {
    return crypto.createHash('sha256').update(ua).digest('hex').slice(0, 32);
  },

  /**
   * Extracts IP prefix (e.g. /24 for IPv4) for loose location pinning.
   */
  getIpPrefix(ip = '') {
    if (!ip) return 'unknown';
    const parts = ip.split('.');
    return parts.length >= 3 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : ip.slice(0, 16);
  },

  /**
   * Creates a new session and returns both an access token and a raw refresh token.
   */
  async createSession({ userId, organizationId = null, userAgent = '', ipAddress = '', familyId = null, client = null }) {
    const db = client || { query };
    // 1. Fetch user token_version and active organization role
    const userRes = await db.query(`SELECT id, role, token_version FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      throw new Error('User not found');
    }
    const user = userRes.rows[0];

    // Role MUST come from organization membership if organizationId is present (Annex A4)
    let membershipRole = user.role || 'Viewer';
    if (organizationId) {
      const memberRes = await db.query(
        `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
        [organizationId, userId]
      );
      if (memberRes.rows.length > 0) {
        membershipRole = memberRes.rows[0].role;
      }
    }

    // 2. Generate cryptographically random 256-bit refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_SLIDING_DAYS * 24 * 60 * 60 * 1000);
    const resolvedFamilyId = familyId || crypto.randomUUID();

    const insertRes = await db.query(
      `INSERT INTO sessions (
         user_id, family_id, token_hash, organization_id,
         ua_hash, ip_prefix, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, family_id, expires_at`,
      [
        userId,
        resolvedFamilyId,
        tokenHash,
        organizationId,
        this.hashUserAgent(userAgent),
        this.getIpPrefix(ipAddress),
        expiresAt
      ]
    );

    const sessionRow = insertRes.rows[0];

    // 3. Issue short-lived 10-minute JWT access token with canonical claims
    const accessToken = jwt.sign(
      {
        sub: userId,
        userId: userId,
        org: organizationId,
        organizationId: organizationId,
        role: membershipRole,
        sid: sessionRow.id,
        ver: user.token_version,
      },
      config.jwtSecret,
      {
        expiresIn: ACCESS_TOKEN_TTL_SEC,
        issuer: 'i3dion-spatial',
        audience: 'i3dion-spatial-api'
      }
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId: sessionRow.id,
      familyId: sessionRow.family_id,
      expiresAt: sessionRow.expires_at,
      role: membershipRole
    };
  },

  /**
   * Rotates a refresh token atomically. Enforces reuse detection and family revocation.
   */
  async rotateSession({ rawRefreshToken, userAgent = '', ipAddress = '' }) {
    if (!rawRefreshToken) {
      const err = new Error('Refresh token is required');
      err.status = 401;
      throw err;
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const result = await withTransaction(async (client) => {
      // Find session row by hash
      const sessionRes = await client.query(
        `SELECT * FROM sessions WHERE token_hash = $1 FOR UPDATE`,
        [tokenHash]
      );

      if (sessionRes.rows.length === 0) {
        const err = new Error('Invalid refresh token');
        err.status = 401;
        throw err;
      }

      const session = sessionRes.rows[0];

      // Check expiry
      if (new Date(session.expires_at) < new Date()) {
        const err = new Error('Refresh token has expired');
        err.status = 401;
        throw err;
      }

      // REUSE DETECTION (Annex A2):
      // If token is already revoked or replaced, this is an attempted token reuse attack!
      if (session.revoked_at || session.replaced_by) {
        // Revoke the entire family immediately on this transaction so it commits durably
        await client.query(
          `UPDATE sessions SET revoked_at = now() WHERE family_id = $1`,
          [session.family_id]
        );

        console.error(
          `🚨 [SECURITY ALERT] Refresh token reuse detected for user ${session.user_id}, family ${session.family_id}. Revoked entire session family.`
        );

        return { reuseDetected: true };
      }

      // Fetch user to check current token_version
      const userRes = await client.query(
        `SELECT id, role, token_version FROM users WHERE id = $1`,
        [session.user_id]
      );
      if (userRes.rows.length === 0) {
        const err = new Error('User account not found');
        err.status = 401;
        throw err;
      }
      const user = userRes.rows[0];

      // Resolve role from active organization membership
      let membershipRole = user.role || 'Viewer';
      if (session.organization_id) {
        const memberRes = await client.query(
          `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
          [session.organization_id, session.user_id]
        );
        if (memberRes.rows.length > 0) {
          membershipRole = memberRes.rows[0].role;
        }
      }

      // Generate new rotating refresh token
      const newRawRefreshToken = crypto.randomBytes(32).toString('base64url');
      const newTokenHash = this.hashToken(newRawRefreshToken);
      const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_SLIDING_DAYS * 24 * 60 * 60 * 1000);

      // Create new session inheriting the existing family_id
      const newSessionRes = await client.query(
        `INSERT INTO sessions (
           user_id, family_id, token_hash, organization_id,
           ua_hash, ip_prefix, expires_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, family_id, expires_at`,
        [
          session.user_id,
          session.family_id,
          newTokenHash,
          session.organization_id,
          this.hashUserAgent(userAgent),
          this.getIpPrefix(ipAddress),
          newExpiresAt
        ]
      );
      const newSession = newSessionRes.rows[0];

      // Mark old session as replaced atomically
      await client.query(
        `UPDATE sessions SET revoked_at = now(), replaced_by = $1 WHERE id = $2`,
        [newSession.id, session.id]
      );

      // Issue new 10-minute access token
      const accessToken = jwt.sign(
        {
          sub: session.user_id,
          userId: session.user_id,
          org: session.organization_id,
          organizationId: session.organization_id,
          role: membershipRole,
          sid: newSession.id,
          ver: user.token_version,
        },
        config.jwtSecret,
        {
          expiresIn: ACCESS_TOKEN_TTL_SEC,
          issuer: 'i3dion-spatial',
          audience: 'i3dion-spatial-api'
        }
      );

      return {
        accessToken,
        refreshToken: newRawRefreshToken,
        sessionId: newSession.id,
        familyId: newSession.family_id,
        expiresAt: newSession.expires_at,
        role: membershipRole
      };
    });

    if (result && result.reuseDetected) {
      const err = new Error('Token reuse detected. All sessions in this family have been terminated.');
      err.status = 401;
      err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    return result;
  },

  /**
   * Revokes a specific session by ID.
   */
  async revokeSession(sessionId) {
    await query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [sessionId]);
  },

  /**
   * Revokes all active sessions for a user and increments token_version to invalidate all existing access tokens.
   */
  async revokeAllUserSessions(userId) {
    await query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1`, [userId]);
    const res = await query(
      `UPDATE users SET token_version = token_version + 1 WHERE id = $1 RETURNING token_version`,
      [userId]
    );
    return res.rows[0]?.token_version;
  },

  /**
   * Sets secure, HttpOnly refresh token cookie on Express response.
   */
  setRefreshCookie(res, refreshToken, expiresAt) {
    res.cookie('i3dion_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      expires: expiresAt instanceof Date ? expiresAt : new Date(Date.now() + REFRESH_TOKEN_SLIDING_DAYS * 24 * 60 * 60 * 1000)
    });
  },

  /**
   * Clears the refresh token cookie upon logout.
   */
  clearRefreshCookie(res) {
    res.clearCookie('i3dion_refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth'
    });
  }
};
