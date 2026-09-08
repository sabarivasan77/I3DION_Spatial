import { entitlementService } from '../services/entitlement/entitlementService.js';

/**
 * Middleware factory to enforce plan resource limits
 */
export function enforceQuota(resourceType) {
  return async (req, res, next) => {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        return res.status(401).json({ error: 'UNAUTHORIZED_TENANT', message: 'Missing organization context.' });
      }

      const check = await entitlementService.checkQuota(organizationId, resourceType);
      if (!check.allowed) {
        return res.status(403).json({
          error: check.reason,
          resourceType,
          current: check.current,
          limit: check.limit,
          message: check.message
        });
      }

      next();
    } catch (err) {
      console.error(`Error enforcing entitlement quota for ${resourceType}:`, err);
      next(err);
    }
  };
}
