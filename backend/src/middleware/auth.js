import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';
import { query } from '../db/pool.js';

const getJwtSecret = () => config.jwtSecret;

const roleRank = {
  Viewer: 1,
  'Analytics Viewer': 1,
  'Read Only': 1,
  Customer: 1,
  'Sales User': 2,
  'Sales Executive': 2,
  'Support Executive': 2,
  Marketing: 2,
  Manager: 3,
  Admin: 4,
  'Company Admin': 5,
  'Super Admin': 6,
};

export async function requireAuth(req, _res, next) {
  try {
    const headerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    const token = headerToken || req.cookies?.accessToken;
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    // Verify local JWT
    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired session');
    }

    // Fetch user and current membership
    const userRes = await query(
      'SELECT id, name, email, organization_id, role FROM users WHERE id = $1',
      [payload.userId]
    );
    const user = userRes.rows[0];

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    let orgId = user.organization_id;
    if (!orgId) {
      // Check organization_members table explicitly for membership
      const memRes = await query(
        'SELECT organization_id, role FROM organization_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1',
        [user.id]
      );
      if (memRes.rows[0]) {
        orgId = memRes.rows[0].organization_id;
        await query('UPDATE users SET organization_id = $1 WHERE id = $2', [orgId, user.id]).catch(() => null);
      } else {
        throw new ApiError(403, 'User does not belong to an organization');
      }
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Viewer',
      organization_id: orgId,
      organizationId: orgId,
    };
    req.organizationId = orgId;
    req.token = token;
    next();
  } catch (error) {
    console.error('requireAuth error:', error.message);
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role;
    if (userRole === 'Super Admin' || userRole === 'Company Admin') {
      return next();
    }

    const userRank = roleRank[userRole] || 0;
    const allowed = roles.some((role) => userRank >= (roleRank[role] || 0));
    if (!allowed) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
}
