import { query } from '../../db/pool.js';

export const ROLE_PERMISSIONS_TABLE = {
  'Super Admin': ['*'],
  'Company Admin': ['*'],
  'Admin': [
    'organization.read', 'organization.update', 'organization.members.manage',
    'billing.read', 'billing.manage',
    'vault.asset.create', 'vault.asset.read', 'vault.asset.update', 'vault.asset.delete', 'vault.asset.publish',
    'studio.catalog.create', 'studio.catalog.read', 'studio.catalog.update', 'studio.catalog.delete', 'studio.catalog.publish',
    'engine.experience.create', 'engine.experience.read', 'engine.experience.update', 'engine.experience.publish',
    'hub.public.view', 'hub.lead.submit',
    'lens.analytics.read', 'lens.dashboard.manage',
    'flow.rule.manage'
  ],
  'Manager': [
    'organization.read',
    'vault.asset.create', 'vault.asset.read', 'vault.asset.update',
    'studio.catalog.create', 'studio.catalog.read', 'studio.catalog.update',
    'engine.experience.create', 'engine.experience.read', 'engine.experience.update',
    'leads.read', 'leads.manage',
    'hub.public.view',
    'lens.analytics.read'
  ],
  'Sales Executive': [
    'organization.read',
    'vault.asset.read',
    'studio.catalog.read',
    'engine.experience.read',
    'leads.read', 'leads.manage',
    'hub.public.view'
  ],
  'Sales User': [
    'organization.read',
    'vault.asset.read',
    'studio.catalog.read',
    'engine.experience.read',
    'leads.read', 'leads.manage',
    'hub.public.view'
  ],
  'Marketing': [
    'organization.read',
    'vault.asset.read', 'vault.asset.create',
    'studio.catalog.create', 'studio.catalog.read', 'studio.catalog.update', 'studio.catalog.publish',
    'leads.read',
    'hub.public.view',
    'lens.analytics.read'
  ],
  'Viewer': [
    'organization.read',
    'vault.asset.read',
    'studio.catalog.read',
    'engine.experience.read',
    'hub.public.view',
    'lens.analytics.read'
  ],
  'Public Visitor': [
    'hub.public.view',
    'hub.lead.submit'
  ]
};

/**
 * Deterministically evaluate whether a user is authorized for an action within an organization.
 */
export async function evaluatePermission({ user, action, targetOrganizationId, resourceId = null }) {
  if (!user) {
    return {
      allowed: false,
      userId: null,
      organizationId: targetOrganizationId || null,
      role: 'Public Visitor',
      action,
      resourceId,
      denialReason: 'Authentication required'
    };
  }

  // Super Admin bypasses organization checks
  if (user.role === 'Super Admin') {
    return {
      allowed: true,
      userId: user.id,
      organizationId: targetOrganizationId || user.organizationId,
      role: user.role,
      action,
      resourceId,
      denialReason: null
    };
  }

  // Enforce Tenant Boundary: User's organization must match target organization
  const userOrgId = user.organizationId || user.organization_id;
  if (targetOrganizationId && userOrgId !== targetOrganizationId) {
    return {
      allowed: false,
      userId: user.id,
      organizationId: targetOrganizationId,
      role: user.role,
      action,
      resourceId,
      denialReason: `Cross-tenant access forbidden. User belongs to ${userOrgId}, target is ${targetOrganizationId}.`
    };
  }

  const role = user.role || 'Viewer';
  const permissions = ROLE_PERMISSIONS_TABLE[role] || [];

  if (permissions.includes('*') || permissions.includes(action)) {
    return {
      allowed: true,
      userId: user.id,
      organizationId: userOrgId,
      role,
      action,
      resourceId,
      denialReason: null
    };
  }

  return {
    allowed: false,
    userId: user.id,
    organizationId: userOrgId,
    role,
    action,
    resourceId,
    denialReason: `Role '${role}' lacks permission for '${action}'`
  };
}
