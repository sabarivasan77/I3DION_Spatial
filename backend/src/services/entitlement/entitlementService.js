import { pool } from '../../db/pool.js';
import { config } from '../../config.js';
import { usageService } from '../usage/usageService.js';

export class EntitlementService {
  /**
   * Get entitlements and current resource usage for an organization
   */
  async getOrganizationEntitlementsAndUsage(organizationId) {
    const subRes = await pool.query(
      `SELECT p.id as plan_id, p.name as plan_name, 
              p.max_active_flows, p.max_monthly_executions,
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
                p.max_active_flows, p.max_monthly_executions,
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
      max_catalogs: 2,
      max_3d_models: 3,
      max_storage_bytes: 52428800,
      max_team_members: 1,
      max_active_flows: 3,
      max_monthly_executions: 1000,
      features: { ar_views: true, qr_codes: true },
      subscription_status: 'active',
      org_created_at: new Date()
    };

    // Apply Global 100-Day Launch Access or Standard Trial if not strictly enforcing plan limits
    const now = new Date();
    const { productLaunchDate, launchWindowEndDate, standardTrialDays } = config.billing || {};
    let isLaunchAccess = false;
    let isTrialAccess = false;
    const shouldEnforceStrict = process.env.ENFORCE_PLAN_LIMITS === 'true' || process.env.NODE_ENV === 'test_quota';
    
    if (!shouldEnforceStrict) {
      if (productLaunchDate && launchWindowEndDate && now >= productLaunchDate && now <= launchWindowEndDate) {
        isLaunchAccess = true;
      } else {
        const trialEndDate = new Date(sub.org_created_at);
        trialEndDate.setDate(trialEndDate.getDate() + (standardTrialDays || 14));
        if (now < trialEndDate) {
          isTrialAccess = true;
        }
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
        sub.max_active_flows = 999999;
        sub.max_monthly_executions = 99999999;
        sub.features = { ar_views: true, qr_codes: true, advanced_analytics: true, custom_branding: true, custom_domain: true, priority_support: true };
        sub.subscription_status = 'active';
      } else if (isTrialAccess) {
        sub.plan_name = 'Free Trial';
        sub.max_products = 25;
        sub.max_catalogs = 10;
        sub.max_3d_models = 25;
        sub.max_storage_bytes = 1073741824; // 1GB
        sub.max_team_members = 3;
        sub.max_active_flows = 10;
        sub.max_monthly_executions = 10000;
        sub.features = { ar_views: true, qr_codes: true, advanced_analytics: true, custom_branding: false, custom_domain: false };
        sub.subscription_status = 'trialing';
      }
    }

    const usage = await usageService.syncOrganizationUsage(organizationId);

    const flowAddonRuns = Number(sub.features?.flow_addon_runs || 0);

    return {
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        limits: {
          maxProducts: sub.max_products,
          maxCatalogs: sub.max_catalogs,
          max3dModels: sub.max_3d_models,
          maxStorageBytes: Number(sub.max_storage_bytes),
          maxTeamMembers: sub.max_team_members,
          maxActiveFlows: sub.max_active_flows || 3,
          maxMonthlyExecutions: (sub.max_monthly_executions || 1000) + flowAddonRuns
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
      case 'active_flows':
      case 'flows': {
        const flowRes = await pool.query(
          `SELECT COUNT(*)::int as count FROM flows WHERE organization_id = $1 AND (status = 'ACTIVE' OR status = 'active' OR status = 'published')`,
          [organizationId]
        );
        current = flowRes.rows[0]?.count || 0;
        max = plan.limits.maxActiveFlows || 3;
        label = 'active flows';
        break;
      }
      case 'flow_runs':
      case 'monthly_executions': {
        const runRes = await pool.query(
          `SELECT COUNT(*)::int as count FROM flow_runs WHERE organization_id = $1 AND started_at >= date_trunc('month', now())`,
          [organizationId]
        );
        current = runRes.rows[0]?.count || 0;
        max = plan.limits.maxMonthlyExecutions || 1000;
        label = 'monthly flow executions';
        break;
      }
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
