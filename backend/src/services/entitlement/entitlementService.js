import { pool } from '../../db/pool.js';
import { config } from '../../config.js';

export class EntitlementService {
  /**
   * Get entitlements and current resource usage for an organization
   */
  async getOrganizationEntitlementsAndUsage(organizationId) {
    const subRes = await pool.query(
      `SELECT p.id as plan_id, p.name as plan_name, 
              COALESCE(s.custom_max_products, p.max_products) as max_products, 
              COALESCE(s.custom_max_catalogs, p.max_catalogs) as max_catalogs,
              COALESCE(s.custom_max_3d_models, p.max_3d_models) as max_3d_models, 
              COALESCE(s.custom_max_storage_bytes, p.max_storage_bytes) as max_storage_bytes, 
              COALESCE(s.custom_max_team_members, p.max_team_members) as max_team_members, 
              COALESCE(s.custom_features, p.features) as features,
              s.custom_price_inr,
              s.status as subscription_status,
              o.created_at as org_created_at
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       JOIN organizations o ON s.organization_id = o.id
       WHERE s.organization_id = $1`,
      [organizationId]
    );

    if (subRes.rows.length === 0) {
      // Auto-repair missing or orphaned subscription record
      await pool.query(
        `INSERT INTO subscriptions (organization_id, plan_id, status)
         VALUES ($1, 'FREE', 'active')
         ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'FREE', status = 'active'`,
        [organizationId]
      );

      const retry = await pool.query(
        `SELECT p.id as plan_id, p.name as plan_name, 
                COALESCE(s.custom_max_products, p.max_products) as max_products, 
                COALESCE(s.custom_max_catalogs, p.max_catalogs) as max_catalogs,
                COALESCE(s.custom_max_3d_models, p.max_3d_models) as max_3d_models, 
                COALESCE(s.custom_max_storage_bytes, p.max_storage_bytes) as max_storage_bytes, 
                COALESCE(s.custom_max_team_members, p.max_team_members) as max_team_members, 
                COALESCE(s.custom_features, p.features) as features,
                s.custom_price_inr,
                s.status as subscription_status,
                o.created_at as org_created_at
         FROM subscriptions s
         JOIN plans p ON s.plan_id = p.id
         JOIN organizations o ON s.organization_id = o.id
         WHERE s.organization_id = $1`,
        [organizationId]
      );
      subRes.rows = retry.rows;
    }

    const sub = subRes.rows[0] || {
      plan_id: 'FREE',
      plan_name: 'Free',
      max_products: 3,
      max_catalogs: 3,
      max_3d_models: 3,
      max_storage_bytes: 52428800,
      max_team_members: 1,
      features: { ar_views: true, qr_codes: true },
      subscription_status: 'active',
      org_created_at: new Date()
    };

    // Apply Global 100-Day Launch Access or Standard 3-Day Trial
    const now = new Date();
    const { productLaunchDate, launchWindowEndDate, standardTrialDays } = config.billing || {};
    let isLaunchAccess = false;
    let isTrialAccess = false;
    
    if (productLaunchDate && launchWindowEndDate && now >= productLaunchDate && now <= launchWindowEndDate) {
      isLaunchAccess = true;
    } else {
      const trialEndDate = new Date(sub.org_created_at);
      trialEndDate.setDate(trialEndDate.getDate() + (standardTrialDays || 3));
      if (now < trialEndDate) {
        isTrialAccess = true;
      }
    }

    if (sub.plan_id === 'FREE') {
      if (isLaunchAccess) {
        sub.plan_name = 'Launch Access';
        sub.max_products = 999999;
        sub.max_catalogs = 999999;
        sub.max_3d_models = 999999;
        sub.max_storage_bytes = 107374182400; // 100GB
        sub.max_team_members = 50;
        sub.features = { ar_views: true, qr_codes: true, advanced_analytics: true, custom_branding: true, custom_domain: true, priority_support: true };
        sub.subscription_status = 'active';
      } else if (isTrialAccess) {
        sub.plan_name = 'Free Trial';
        sub.max_products = 25;
        sub.max_catalogs = 10;
        sub.max_3d_models = 25;
        sub.max_storage_bytes = 1073741824; // 1GB
        sub.max_team_members = 3;
        sub.features = { ar_views: true, qr_codes: true, advanced_analytics: true, custom_branding: false, custom_domain: false };
        sub.subscription_status = 'trialing';
      }
    }

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
