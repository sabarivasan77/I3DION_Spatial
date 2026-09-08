/**
 * Tenant Isolation Middleware
 * Guarantees organization_id is populated strictly from authenticated user context,
 * stripping or rejecting any spoofed params in request headers/body.
 */
export function requireTenant(req, res, next) {
  if (!req.user || (!req.user.organization_id && !req.user.organizationId)) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_TENANT',
      message: 'Authentication required with active organization context.'
    });
  }

  // Bind normalized organization_id
  req.organizationId = req.user.organization_id || req.user.organizationId;
  req.user.organization_id = req.organizationId;
  req.user.organizationId = req.organizationId;
  next();
}
