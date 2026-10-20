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

    const userId = payload.sub || payload.userId;
    if (!userId) {
      throw new ApiError(401, 'Malformed token payload: missing subject');
    }

    // Fetch user and token_version
    const userRes = await query(
      'SELECT id, name, email, organization_id, role, token_version FROM users WHERE id = $1',
      [userId]
    );
    const user = userRes.rows[0];

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    // Annex A2: Token Version Validation (Revocation check)
    // If token payload has 'ver' and it does not match user's current token_version, session is revoked
    if (payload.ver !== undefined && payload.ver !== user.token_version) {
      throw new ApiError(401, 'Session has been revoked. Please log in again.');
    }

    // Resolve active organization: prefer token payload org, then user.organization_id
    let orgId = payload.org || payload.organizationId || user.organization_id;
    let membershipRole = 'Viewer';

    if (orgId) {
      const memRes = await query(
        'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgId, user.id]
      );
      if (memRes.rows.length > 0) {
        membershipRole = memRes.rows[0].role;
      } else if (user.organization_id === orgId) {
        membershipRole = user.role || 'Admin';
        await query(
          'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [orgId, user.id, membershipRole]
        ).catch(() => {});
      } else {
        // Not a member of the requested org
        orgId = null;
      }
    }

    if (!orgId) {
      // Fallback: check if user has any active organization membership
      const anyMemRes = await query(
        'SELECT organization_id, role FROM organization_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1',
        [user.id]
      );
      if (anyMemRes.rows.length > 0) {
        orgId = anyMemRes.rows[0].organization_id;
        membershipRole = anyMemRes.rows[0].role;
      } else {
        throw new ApiError(403, 'User does not belong to an active organization');
      }
    }

    req.user = {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: membershipRole,
      organization_id: orgId,
      organizationId: orgId,
      tokenVersion: user.token_version,
      sid: payload.sid
    };
    req.organizationId = orgId;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, error.message || 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role;
    // Super Admin has every organization-level permission. Platform-staff
    // routes use their own explicit allowlist and are never authorized here.
    if (roles.includes(userRole) || userRole === 'Super Admin' || userRole === 'Owner' || userRole === 'Admin') {
      return next();
    }

    return next(new ApiError(403, `Insufficient permissions: required one of [${roles.join(', ')}]`));
  };
}

export { can, authorize, PERMISSIONS } from './authorizationEngine.js';
