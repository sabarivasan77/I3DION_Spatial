import { pool } from '../../db/pool.js';

export class UsageService {
  /**
   * Recalculate usage counters for an organization from actual DB tables
   */
  async syncOrganizationUsage(organizationId) {
    const res = await pool.query(
      `INSERT INTO usage_counters (organization_id, products_count, catalogs_count, models_count, storage_bytes_used, team_members_count)
       VALUES (
         $1,
         (SELECT COUNT(*) FROM products WHERE organization_id = $1),
         (SELECT COUNT(*) FROM catalogs WHERE organization_id = $1),
         (SELECT COUNT(*) FROM product_assets WHERE organization_id = $1 AND asset_type IN ('model', 'usdz_model')),
         COALESCE((SELECT SUM(size_bytes) FROM product_assets WHERE organization_id = $1), 0),
         (SELECT COUNT(*) FROM users WHERE organization_id = $1)
       )
       ON CONFLICT (organization_id) DO UPDATE SET
         products_count = EXCLUDED.products_count,
         catalogs_count = EXCLUDED.catalogs_count,
         models_count = EXCLUDED.models_count,
         storage_bytes_used = EXCLUDED.storage_bytes_used,
         team_members_count = EXCLUDED.team_members_count,
         updated_at = now()
       RETURNING *`,
      [organizationId]
    );
    return res.rows[0];
  }

  /**
   * Increment usage counter atomically
   */
  async incrementCounter(organizationId, field, amount = 1) {
    const validFields = {
      products: 'products_count',
      catalogs: 'catalogs_count',
      models: 'models_count',
      storage: 'storage_bytes_used',
      team_members: 'team_members_count'
    };

    const columnName = validFields[field];
    if (!columnName) throw new Error(`Invalid counter field: ${field}`);

    await pool.query(
      `UPDATE usage_counters
       SET ${columnName} = GREATEST(0, ${columnName} + $2),
           updated_at = now()
       WHERE organization_id = $1`,
      [organizationId, amount]
    );
  }
}

export const usageService = new UsageService();
