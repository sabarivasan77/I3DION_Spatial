/**
 * Route Policy Registry (Annex A4)
 * Maps API routes to canonical permission actions.
 * CI security suite verifies that zero routes remain unmapped.
 */

export const ROUTE_POLICIES = {
  // Vault Assets & Datasets
  'GET /api/vault/assets': { action: 'vault:read' },
  'POST /api/vault/assets': { action: 'vault:create' },
  'GET /api/vault/assets/:id': { action: 'vault:read' },
  'PUT /api/vault/assets/:id': { action: 'vault:update' },
  'DELETE /api/vault/assets/:id': { action: 'vault:delete' },

  // Vault Products
  'GET /api/vault/products': { action: 'product:read' },
  'POST /api/vault/products': { action: 'product:create' },
  'GET /api/vault/products/:id': { action: 'product:read' },
  'PUT /api/vault/products/:id': { action: 'product:update' },
  'DELETE /api/vault/products/:id': { action: 'product:delete' },

  // Studio & Catalogs
  'GET /api/studio/catalogs': { action: 'catalog:read' },
  'POST /api/studio/catalogs': { action: 'catalog:create' },
  'GET /api/studio/catalogs/:id': { action: 'catalog:read' },
  'PUT /api/studio/catalogs/:id': { action: 'catalog:update' },
  'DELETE /api/studio/catalogs/:id': { action: 'catalog:delete' },
  'POST /api/studio/catalogs/:id/publish': { action: 'catalog:publish' },

  // Leads & CRM
  'GET /api/leads': { action: 'lead:read' },
  'PUT /api/leads/:id': { action: 'lead:update' },
  'POST /api/leads/export': { action: 'lead:export' },

  // Lens & Analytics
  'GET /api/lens/overview': { action: 'lens:read' },
  'GET /api/lens/funnel': { action: 'lens:read' },
  'GET /api/lens/export': { action: 'lens:export' },
  'GET /api/analytics': { action: 'lens:read' },

  // Organization & Membership
  'GET /api/organization': { action: 'org:read' },
  'PUT /api/organization': { action: 'org:update' },
  'POST /api/organization/invites': { action: 'org:invite' },
  'DELETE /api/organization/members/:id': { action: 'org:manage_members' },

  // Billing & Subscriptions
  'GET /api/billing/usage': { action: 'billing:read' },
  'GET /api/billing/invoices': { action: 'billing:read' },
  'POST /api/billing/checkout': { action: 'billing:checkout' },
  'POST /api/billing/cancel': { action: 'billing:cancel' },

  // Security & Audit
  'GET /api/security/audit-trail': { action: 'audit:read' }
};

/**
 * Resolves the matching policy for a given method and path.
 */
export function getRoutePolicy(method, path) {
  const normalizedMethod = method.toUpperCase();
  const directKey = `${normalizedMethod} ${path}`;
  if (ROUTE_POLICIES[directKey]) {
    return ROUTE_POLICIES[directKey];
  }

  // Parameterized match (e.g. /api/studio/catalogs/123 -> /api/studio/catalogs/:id)
  for (const [pattern, policy] of Object.entries(ROUTE_POLICIES)) {
    const [m, p] = pattern.split(' ');
    if (m === normalizedMethod) {
      const regexStr = '^' + p.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
      if (new RegExp(regexStr).test(path)) {
        return policy;
      }
    }
  }

  return null;
}
