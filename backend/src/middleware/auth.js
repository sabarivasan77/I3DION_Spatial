import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { hashToken } from '../services/tokens.js';
import { ApiError } from '../utils/errors.js';

const roleRank = {
  Viewer: 1,
  'Sales User': 2,
  Manager: 3,
  Admin: 4,
};

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    const refreshToken = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = jwt.verify(token, config.jwtSecret);
    
    // Verify user exists and has a valid session if refresh token is present
    const { rows } = await query(
      `SELECT u.id, u.company_id, u.name, u.email, u.role
       FROM users u
       ${refreshToken ? 'JOIN user_sessions s ON s.user_id = u.id' : ''}
       WHERE u.id = $1
         ${refreshToken ? 'AND s.refresh_token_hash = $2 AND s.is_revoked = false AND s.expires_at > now()' : ''}`,
      refreshToken ? [payload.sub, hashToken(refreshToken)] : [payload.sub],
    );

    if (!rows[0]) {
      throw new ApiError(401, 'Invalid session');
    }

    req.user = rows[0];
    req.token = token;
    req.tokenHash = hashToken(token);
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const allowed = roles.some((role) => roleRank[req.user.role] >= roleRank[role]);
    if (!allowed) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
}
