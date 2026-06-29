import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signAccessToken(user, sessionId = crypto.randomUUID()) {
  return jwt.sign(
    {
      role: user.role,
      companyId: user.company_id,
      sid: sessionId,
    },
    config.jwtSecret,
    {
      subject: user.id,
      jwtid: sessionId,
      expiresIn: config.jwtExpiresIn,
    },
  );
}

export function createResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
