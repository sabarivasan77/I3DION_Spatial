import { pool, withTenant } from '../../db/pool.js';

/**
 * Standard Commercial Plan Limits
 */
export const PLAN_LIMITS = {
  FREE: {
    id: 'FREE',
    name: 'Free Tier',
    priceInr: 0,
    maxActiveFlows: 3,
    maxMonthlyExecutions: 1000,
    maxVaultAssets: 25,
    features: ['hub', 'vault', 'studio', 'engine', 'flow'],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter Tier',
    priceInr: 1499,
    maxActiveFlows: 10,
    maxMonthlyExecutions: 10000,
    maxVaultAssets: 100,
    features: ['hub', 'vault', 'studio', 'engine', 'flow'],
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business Tier',
    priceInr: 4999,
    maxActiveFlows: 50,
    maxMonthlyExecutions: 100000,
    maxVaultAssets: 1000,
    features: ['hub', 'vault', 'studio', 'engine', 'flow', 'lens'],
  },
  UNLIMITED: {
    id: 'UNLIMITED',
    name: 'Enterprise Unlimited',
    priceInr: 14999,
    maxActiveFlows: 999999,
    maxMonthlyExecutions: 99999999,
    maxVaultAssets: 999999,
    features: ['hub', 'vault', 'studio', 'engine', 'flow', 'lens', 'dedicated_support'],
  },
};

/**
 * 1. Ensure Plans and Subscriptions tables exist
 */
export async function ensureBillingTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id text PRIMARY KEY,
      name text NOT NULL,
      price_monthly_inr integer NOT NULL DEFAULT 0,
      features jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_active_flows integer DEFAULT 3;
    ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_monthly_executions integer DEFAULT 1000;
    ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_vault_assets integer DEFAULT 25;
    ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_inr numeric(10, 2) DEFAULT 0;

    INSERT INTO plans (id, name, price_monthly_inr, price_inr, max_active_flows, max_monthly_executions, max_vault_assets, features)
    VALUES 
      ('FREE', 'Free Tier', 0, 0, 3, 1000, 25, '["hub", "vault", "studio", "engine", "flow"]'::jsonb),
      ('STARTER', 'Starter Tier', 1499, 1499, 10, 10000, 100, '["hub", "vault", "studio", "engine", "flow"]'::jsonb),
      ('BUSINESS', 'Business Tier', 4999, 4999, 50, 100000, 1000, '["hub", "vault", "studio", "engine", "flow", "lens"]'::jsonb),
      ('UNLIMITED', 'Enterprise Unlimited', 14999, 14999, 999999, 99999999, 999999, '["hub", "vault", "studio", "engine", "flow", "lens", "dedicated_support"]'::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      max_active_flows = EXCLUDED.max_active_flows,
      max_monthly_executions = EXCLUDED.max_monthly_executions,
      max_vault_assets = EXCLUDED.max_vault_assets,
      price_inr = EXCLUDED.price_inr;

    CREATE TABLE IF NOT EXISTS subscriptions (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      plan_id text NOT NULL REFERENCES plans(id) DEFAULT 'FREE',
      status text NOT NULL DEFAULT 'active',
      billing_cycle text NOT NULL DEFAULT 'monthly',
      current_period_start timestamptz NOT NULL DEFAULT now(),
      current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
  `);
}

/**
 * 2. Get organization plan and current usage stats
 */
export async function getOrganizationPlan(organizationId) {
  await ensureBillingTables();

  const subRes = await pool.query(
    `SELECT s.plan_id, p.name, COALESCE(p.price_inr, p.price_monthly_inr, 0) AS price_inr,
            COALESCE(p.max_active_flows, 3) AS max_active_flows,
            COALESCE(p.max_monthly_executions, 1000) AS max_monthly_executions,
            COALESCE(p.max_vault_assets, 25) AS max_vault_assets,
            p.features
     FROM subscriptions s
     JOIN plans p ON s.plan_id = p.id
     WHERE s.organization_id = $1`,
    [organizationId]
  );

  const plan = subRes.rows[0] || {
    plan_id: 'FREE',
    name: 'Free Tier',
    price_inr: 0,
    max_active_flows: 3,
    max_monthly_executions: 1000,
    max_vault_assets: 25,
    features: ['hub', 'vault', 'studio', 'engine', 'flow'],
  };

  // Count active workflows
  const flowCountRes = await pool.query(
    `SELECT COUNT(*)::integer AS active_flows
     FROM flows
     WHERE organization_id = $1 AND status != 'archived'`,
    [organizationId]
  );
  const activeFlows = flowCountRes.rows[0]?.active_flows || 0;

  // Count monthly executions
  const execCountRes = await pool.query(
    `SELECT COUNT(*)::integer AS monthly_runs
     FROM flow_runs
     WHERE organization_id = $1 AND started_at >= date_trunc('month', now())`,
    [organizationId]
  );
  const monthlyRuns = execCountRes.rows[0]?.monthly_runs || 0;

  return {
    plan: {
      id: plan.plan_id,
      name: plan.name,
      priceInr: Number(plan.price_inr),
      maxActiveFlows: plan.max_active_flows,
      maxMonthlyExecutions: plan.max_monthly_executions,
      maxVaultAssets: plan.max_vault_assets,
      features: plan.features,
    },
    usage: {
      activeFlows,
      flowsRemaining: Math.max(0, plan.max_active_flows - activeFlows),
      monthlyRuns,
      executionsRemaining: Math.max(0, plan.max_monthly_executions - monthlyRuns),
    },
  };
}

/**
 * 3. Assert flow creation quota (enforced on createFlow, duplicateFlow, instantiateRecipe)
 */
export async function assertFlowCreationQuota(organizationId) {
  const { plan, usage } = await getOrganizationPlan(organizationId);

  if (usage.activeFlows >= plan.maxActiveFlows) {
    const error = new Error(
      `Workflow creation limit reached for ${plan.name} (${usage.activeFlows}/${plan.maxActiveFlows}). Upgrade your subscription tier to create additional workflows.`
    );
    error.status = 403;
    error.code = 'QUOTA_FLOWS_EXCEEDED';
    error.quota = {
      current: usage.activeFlows,
      limit: plan.maxActiveFlows,
      plan: plan.id,
    };
    throw error;
  }
}

/**
 * 4. Assert monthly execution quota (enforced on executeFlowRun)
 */
export async function assertFlowExecutionQuota(organizationId) {
  const { plan, usage } = await getOrganizationPlan(organizationId);

  if (usage.monthlyRuns >= plan.maxMonthlyExecutions) {
    const error = new Error(
      `Monthly execution quota exceeded for ${plan.name} (${usage.monthlyRuns}/${plan.maxMonthlyExecutions}). Upgrade your subscription tier to continue autonomous execution.`
    );
    error.status = 403;
    error.code = 'QUOTA_EXECUTIONS_EXCEEDED';
    error.quota = {
      current: usage.monthlyRuns,
      limit: plan.maxMonthlyExecutions,
      plan: plan.id,
    };
    throw error;
  }
}

/**
 * 5. Upgrade or change an organization's subscription tier
 */
export async function setOrganizationPlan(organizationId, planId) {
  await ensureBillingTables();
  const normalizedPlanId = String(planId).toUpperCase();

  if (!PLAN_LIMITS[normalizedPlanId]) {
    throw new Error(`Invalid plan tier "${planId}". Valid tiers: FREE, STARTER, BUSINESS, UNLIMITED`);
  }

  const res = await pool.query(
    `INSERT INTO subscriptions (organization_id, plan_id, status, current_period_start, current_period_end, updated_at)
     VALUES ($1, $2, 'active', now(), now() + interval '30 days', now())
     ON CONFLICT (organization_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = 'active',
       updated_at = now()
     RETURNING *`,
    [organizationId, normalizedPlanId]
  );

  return res.rows[0];
}
