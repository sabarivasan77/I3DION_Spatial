/**
 * Canonical Authorization Engine can() (Annex A4)
 * Single decision point for all access decisions.
 * Replaces ad-hoc string checks and disparate requireRole guards.
 * Enforces membership-based roles, tenant boundaries, and explicit permissions.
 */

import { query } from '../db/pool.js';

/**
 * Explicit Tenant Role Permissions Matrix
 * Roles: Owner, Admin, Manager, Sales, Marketing, Analyst, Viewer
 * NO wildcard bypass roles, NO rank math.
 */
export const PERMISSIONS = {
  Owner: [
    'org:read', 'org:update', 'org:delete', 'org:invite', 'org:manage_members',
    'billing:read', 'billing:checkout', 'billing:cancel',
    'vault:read', 'vault:create', 'vault:update', 'vault:delete',
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:delete', 'catalog:publish',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'lead:read', 'lead:update', 'lead:export',
    'lens:read', 'lens:export',
    'flow:read', 'flow:create', 'flow:update', 'flow:delete', 'flow:publish', 'flow:execute', 'flow:archive',
    'studio:read', 'studio:create', 'studio:update', 'studio:delete', 'studio:publish',
    'engine:read', 'engine:update',
    'audit:read'
  ],
  Admin: [
    'org:read', 'org:update', 'org:invite', 'org:manage_members',
    'billing:read', 'billing:checkout',
    'vault:read', 'vault:create', 'vault:update', 'vault:delete',
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:delete', 'catalog:publish',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'lead:read', 'lead:update', 'lead:export',
    'lens:read', 'lens:export',
    'flow:read', 'flow:create', 'flow:update', 'flow:delete', 'flow:publish', 'flow:execute', 'flow:archive',
    'studio:read', 'studio:create', 'studio:update', 'studio:delete', 'studio:publish',
    'engine:read', 'engine:update',
    'audit:read'
  ],
  Manager: [
    'org:read',
    'vault:read', 'vault:create', 'vault:update',
    'catalog:read', 'catalog:create', 'catalog:update',
    'product:read', 'product:create', 'product:update',
    'lead:read', 'lead:update',
    'lens:read',
    'flow:read', 'flow:create', 'flow:update', 'flow:execute',
    'studio:read', 'studio:create', 'studio:update',
    'engine:read', 'engine:update'
  ],
  Sales: [
    'org:read',
    'vault:read',
    'catalog:read',
    'product:read',
    'lead:read', 'lead:update', 'lead:export',
    'flow:read', 'flow:execute',
    'studio:read',
    'engine:read'
  ],
  Marketing: [
    'org:read',
    'vault:read', 'vault:create',
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:publish',
    'product:read',
    'lens:read',
    'flow:read', 'flow:execute',
    'studio:read', 'studio:create', 'studio:update', 'studio:publish',
    'engine:read'
  ],
  Analyst: [
    'org:read',
    'vault:read',
    'catalog:read',
    'product:read',
    'lead:read',
    'lens:read', 'lens:export',
    'flow:read',
    'studio:read',
    'audit:read'
  ],
  Viewer: [
    'org:read',
    'vault:read',
    'catalog:read',
    'product:read',
    'flow:read',
    'studio:read',
    'engine:read'
  ]
};

/**
 * Single Decision Point: can(actor, action, resource)
 *
 * @param {Object} actor - { userId, organizationId, role, tokenVersion }
 * @param {string} action - e.g. 'catalog:publish'
 * @param {Object|null} resource - { id, organization_id, status, ... }
 * @returns {Promise<{ allow: boolean, reason?: string, role?: string }>}
 */
export async function can(actor, action, resource = null) {
  // 1. Authentication & Tenant Context Check
  if (!actor || !actor.userId) {
    return { allow: false, reason: 'Unauthenticated actor' };
  }

  const organizationId = actor.organizationId || actor.org;
  if (!organizationId) {
    return { allow: false, reason: 'Missing active organization context' };
  }

  // 2. Resolve Membership: Role from active organization membership, with direct user org fallback
  const memberRes = await query(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, actor.userId]
  );

  let membershipRole;
  if (memberRes.rows.length > 0) {
    membershipRole = memberRes.rows[0].role;
  } else {
    // Strangler fallback: check user's assigned organization in users table
    const userRes = await query(
      `SELECT role, organization_id FROM users WHERE id = $1`,
      [actor.userId]
    );
    if (userRes.rows.length > 0 && userRes.rows[0].organization_id === organizationId) {
      membershipRole = userRes.rows[0].role;
    } else {
      return { allow: false, reason: 'Actor is not an active member of this organization' };
    }
  }

  // Normalize role aliases
  if (membershipRole === 'Sales User') membershipRole = 'Sales';
  if (membershipRole === 'Super Admin') membershipRole = 'Owner';

  // 3. Tenant Isolation Check: resource organization must match actor organization
  if (resource) {
    const resourceOrgId = resource.organization_id || resource.organizationId;
    if (resourceOrgId && resourceOrgId !== organizationId) {
      return { allow: false, reason: 'Cross-tenant boundary violation: resource belongs to another organization' };
    }

    // 5. Resource-Specific Invariant Conditions
    if (action === 'catalog:delete' && resource.status === 'Published') {
      return { allow: false, reason: 'Cannot delete a published catalog experience. Unpublish first.' };
    }
  }

  // 4. Matrix Permission Check
  const allowedActions = PERMISSIONS[membershipRole] || [];
  if (!allowedActions.includes(action)) {
    return {
      allow: false,
      reason: `Role '${membershipRole}' does not have permission to perform '${action}'`,
      role: membershipRole
    };
  }

  return { allow: true, role: membershipRole };
}

/**
 * Express Middleware Factory: authorize(action, resourceLoader)
 */
export function authorize(action, resourceLoader = null) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      let resource = null;
      if (typeof resourceLoader === 'function') {
        resource = await resourceLoader(req);
        if (!resource && req.params.id) {
          return res.status(404).json({ error: 'Resource not found' });
        }
      }

      const decision = await can(req.user, action, resource);
      if (!decision.allow) {
        return res.status(403).json({
          error: 'Access denied',
          reason: decision.reason,
          action
        });
      }

      // Attach verified membership role to request
      req.membershipRole = decision.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}
