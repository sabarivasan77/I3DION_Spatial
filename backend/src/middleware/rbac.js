import { ApiError } from '../utils/errors.js';
import { logAudit, createSecurityAlert } from '../utils/audit.js';

/**
 * Require specific user roles to access a route.
 * @param {string[]} roles Array of allowed roles (e.g., ['Super Admin', 'Company Admin'])
 */
export function requireRole(roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (!roles.includes(req.user.role) && req.user.role !== 'Super Admin') {
        
        // Log unauthorized attempt
        logAudit({
          companyId: req.user.company_id,
          userId: req.user.id,
          action: 'unauthorized_access_attempt',
          details: { path: req.originalUrl, requiredRoles: roles, userRole: req.user.role },
          req
        });
        
        createSecurityAlert({
          companyId: req.user.company_id,
          userId: req.user.id,
          alertType: 'RBAC Violation',
          severity: 'Low',
          details: { path: req.originalUrl, method: req.method }
        });

        next(new ApiError(403, 'You do not have permission to perform this action.'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Require the user to belong to the requested company ID, or be a Super Admin.
 */
export function requireCompanyAccess() {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const targetCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

      if (!targetCompanyId) {
        return next(); // Nothing to validate against
      }

      if (req.user.role !== 'Super Admin' && req.user.company_id !== targetCompanyId) {
        
        logAudit({
          companyId: req.user.company_id,
          userId: req.user.id,
          action: 'cross_company_access_attempt',
          details: { path: req.originalUrl, targetCompanyId },
          req
        });

        createSecurityAlert({
          companyId: req.user.company_id,
          userId: req.user.id,
          alertType: 'Cross-Tenant Access Attempt',
          severity: 'High',
          details: { path: req.originalUrl, targetCompanyId }
        });

        throw new AppError(403, 'Unauthorized company access');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
