import { pool } from '../../db/pool.js';
import { billingProvider } from '../billing/billingProvider.js';

export class SubscriptionService {
  /**
   * Get subscription details along with plan features and resource limits
   */
  async getOrganizationSubscription(organizationId) {
    const res = await pool.query(
      `SELECT s.*, p.name as plan_name, p.description as plan_description, 
              COALESCE(s.custom_price_inr, p.price_monthly_inr) as price_monthly_inr,
              p.price_yearly_inr, 
              COALESCE(s.custom_max_products, p.max_products) as max_products, 
              COALESCE(s.custom_max_catalogs, p.max_catalogs) as max_catalogs, 
              COALESCE(s.custom_max_3d_models, p.max_3d_models) as max_3d_models, 
              COALESCE(s.custom_max_storage_bytes, p.max_storage_bytes) as max_storage_bytes, 
              COALESCE(s.custom_max_team_members, p.max_team_members) as max_team_members, 
              COALESCE(s.custom_features, p.features) as features
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.organization_id = $1`,
      [organizationId]
    );

    if (res.rows.length === 0) {
      // Fallback: create FREE subscription if missing
      await pool.query(
        `INSERT INTO subscriptions (organization_id, plan_id, status)
         VALUES ($1, 'FREE', 'active')
         ON CONFLICT (organization_id) DO NOTHING`,
        [organizationId]
      );
      return this.getOrganizationSubscription(organizationId);
    }

    return res.rows[0];
  }

  /**
   * Get all active SaaS plans
   */
  async getAllPlans() {
    const res = await pool.query(`SELECT * FROM plans WHERE is_active = true ORDER BY price_monthly_inr ASC`);
    return res.rows;
  }

  /**
   * Change or upgrade organization subscription plan
   */
  async changePlan(organizationId, newPlanId, billingCycle = 'monthly') {
    const planRes = await pool.query(`SELECT * FROM plans WHERE id = $1 AND is_active = true`, [newPlanId]);
    if (planRes.rows.length === 0) {
      throw new Error(`Plan ${newPlanId} does not exist or is inactive`);
    }

    const plan = planRes.rows[0];

    const updatedSub = await pool.query(
      `UPDATE subscriptions
       SET plan_id = $1,
           billing_cycle = $2,
           status = 'active',
           current_period_start = now(),
           current_period_end = now() + (CASE WHEN $2 = 'yearly' THEN interval '1 year' ELSE interval '1 month' END),
           cancel_at_period_end = false,
           updated_at = now()
       WHERE organization_id = $3
       RETURNING *`,
      [newPlanId, billingCycle, organizationId]
    );

    return updatedSub.rows[0];
  }

  /**
   * Cancel subscription at current period end
   */
  async cancelSubscription(organizationId) {
    const res = await pool.query(
      `UPDATE subscriptions
       SET cancel_at_period_end = true,
           cancelled_at = now(),
           updated_at = now()
       WHERE organization_id = $1
       RETURNING *`,
      [organizationId]
    );
    return res.rows[0];
  }
}

export const subscriptionService = new SubscriptionService();
