/**
 * RBAC Permission Matrix
 */
const ROLE_PERMISSIONS = {
  'Super Admin': ['*'],
  'Company Admin': ['*'],
  'Admin': [
    'organization.read', 'organization.update', 'organization.members.manage',
    'billing.read', 'billing.manage',
    'products.create', 'products.read', 'products.update', 'products.delete',
    'catalogs.create', 'catalogs.read', 'catalogs.update', 'catalogs.delete',
    'leads.read', 'leads.manage', 'analytics.read'
  ],
  'Manager': [
    'organization.read',
    'products.create', 'products.read', 'products.update', 'products.delete',
    'catalogs.create', 'catalogs.read', 'catalogs.update', 'catalogs.delete',
    'leads.read', 'leads.manage', 'analytics.read'
  ],
  'Sales Executive': [
    'organization.read',
    'products.read',
    'catalogs.read',
    'leads.read', 'leads.manage'
  ],
  'Sales User': [
    'organization.read',
    'products.read',
    'catalogs.read',
    'leads.read', 'leads.manage'
  ],
  'Viewer': [
    'organization.read', 'products.read', 'catalogs.read', 'analytics.read'
  ]
};

export function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'Viewer';
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['Viewer'];

    if (permissions.includes('*') || permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      error: 'FORBIDDEN_PERMISSION',
      message: `Your role (${userRole}) lacks permission for action: ${permission}`
    });
  };
}
