import { pool } from '../../db/pool.js';

export class EntitlementService {
  /**
   * Get entitlements and current resource usage for an organization
   */
  async getOrganizationEntitlementsAndUsage(organizationId) {
    const subRes = await pool.query(
      `SELECT p.id as plan_id, p.name as plan_name, p.max_products, p.max_catalogs,
              p.max_3d_models, p.max_storage_bytes, p.max_team_members, p.features,
              s.status as subscription_status
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.organization_id = $1`,
      [organizationId]
    );

    const sub = subRes.rows[0] || {
      plan_id: 'FREE',
      max_products: 3,
      max_catalogs: 2,
      max_3d_models: 3,
      max_storage_bytes: 52428800,
      max_team_members: 1,
      features: { ar_views: true, qr_codes: true },
      subscription_status: 'active'
    };

    const usageRes = await pool.query(
      `SELECT products_count, catalogs_count, models_count, storage_bytes_used, team_members_count
       FROM usage_counters
       WHERE organization_id = $1`,
      [organizationId]
    );

    const usage = usageRes.rows[0] || {
      products_count: 0,
      catalogs_count: 0,
      models_count: 0,
      storage_bytes_used: 0,
      team_members_count: 1
    };

    return {
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        limits: {
          maxProducts: sub.max_products,
          maxCatalogs: sub.max_catalogs,
          max3dModels: sub.max_3d_models,
          maxStorageBytes: Number(sub.max_storage_bytes),
          maxTeamMembers: sub.max_team_members
        },
        features: sub.features,
        status: sub.subscription_status
      },
      usage: {
        productsCount: usage.products_count,
        catalogsCount: usage.catalogs_count,
        modelsCount: usage.models_count,
        storageBytesUsed: Number(usage.storage_bytes_used),
        teamMembersCount: usage.team_members_count
      }
    };
  }

  /**
   * Check if organization can create a resource type
   */
  async checkQuota(organizationId, resourceType, incrementBy = 1) {
    const { plan, usage } = await this.getOrganizationEntitlementsAndUsage(organizationId);

    if (plan.status !== 'active' && plan.status !== 'trialing') {
      return {
        allowed: false,
        reason: 'SUBSCRIPTION_INACTIVE',
        message: 'Your organization subscription is currently inactive or payment is past due.'
      };
    }

    let current = 0;
    let max = 0;
    let label = '';

    switch (resourceType) {
      case 'products':
        current = usage.productsCount;
        max = plan.limits.maxProducts;
        label = 'products';
        break;
      case 'catalogs':
        current = usage.catalogsCount;
        max = plan.limits.maxCatalogs;
        label = 'catalogs';
        break;
      case '3d_models':
        current = usage.modelsCount;
        max = plan.limits.max3dModels;
        label = '3D models';
        break;
      case 'team_members':
        current = usage.teamMembersCount;
        max = plan.limits.maxTeamMembers;
        label = 'team members';
        break;
      case 'storage':
        current = usage.storageBytesUsed;
        max = plan.limits.maxStorageBytes;
        label = 'storage quota';
        break;
      default:
        return { allowed: true };
    }

    if (current + incrementBy > max) {
      return {
        allowed: false,
        reason: 'LIMIT_REACHED',
        resourceType,
        current,
        limit: max,
        message: `Limit reached: Your plan allows a maximum of ${max} ${label}. Please upgrade your plan to add more.`
      };
    }

    return { allowed: true, current, limit: max };
  }
}

export const entitlementService = new EntitlementService();
