import { z } from 'zod';
import { query } from '../../db/pool.js';
import { auditService } from './auditService.js';

export const configPayloadSchema = z.object({
  recency_decay_half_life_days: z.number().min(1).max(180).optional(),
  frequency_weight: z.number().min(0.1).max(10.0).optional(),
  recency_weight: z.number().min(0.1).max(10.0).optional(),
  depth_weight: z.number().min(0.1).max(10.0).optional(),
  intent_weight: z.number().min(0.1).max(10.0).optional(),
  lead_cold_threshold: z.number().min(0).max(100).optional(),
  lead_warm_threshold: z.number().min(0).max(100).optional(),
  lead_hot_threshold: z.number().min(0).max(100).optional(),
  lead_high_intent_threshold: z.number().min(0).max(100).optional(),
  custom_rules: z.array(z.any()).optional(),
});

export class AlgorithmConfigService {
  /**
   * Retrieves algorithm configuration for an organization.
   */
  async getAlgorithmConfig(organizationId) {
    if (!organizationId) {
      throw new Error('organizationId required for algorithm config');
    }

    const { rows } = await query(
      `SELECT * FROM algorithm_configs WHERE organization_id = $1`,
      [organizationId]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Default configuration
    return {
      organization_id: organizationId,
      recency_decay_half_life_days: 14,
      frequency_weight: 1.5,
      recency_weight: 2.0,
      depth_weight: 1.2,
      intent_weight: 3.0,
      lead_cold_threshold: 24,
      lead_warm_threshold: 49,
      lead_hot_threshold: 74,
      lead_high_intent_threshold: 100,
      custom_rules: [],
    };
  }

  /**
   * Updates algorithm configuration for an organization (Admin feature).
   */
  async updateAlgorithmConfig({ organizationId, userId, configPayload }) {
    if (!organizationId) {
      throw new Error('organizationId required for updating config');
    }

    const validated = configPayloadSchema.parse(configPayload);

    const existing = await this.getAlgorithmConfig(organizationId);
    const updated = { ...existing, ...validated };

    const sql = `
      INSERT INTO algorithm_configs (
        organization_id, recency_decay_half_life_days, frequency_weight, recency_weight,
        depth_weight, intent_weight, lead_cold_threshold, lead_warm_threshold,
        lead_hot_threshold, lead_high_intent_threshold, custom_rules, updated_by, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (organization_id) DO UPDATE SET
        recency_decay_half_life_days = EXCLUDED.recency_decay_half_life_days,
        frequency_weight = EXCLUDED.frequency_weight,
        recency_weight = EXCLUDED.recency_weight,
        depth_weight = EXCLUDED.depth_weight,
        intent_weight = EXCLUDED.intent_weight,
        lead_cold_threshold = EXCLUDED.lead_cold_threshold,
        lead_warm_threshold = EXCLUDED.lead_warm_threshold,
        lead_hot_threshold = EXCLUDED.lead_hot_threshold,
        lead_high_intent_threshold = EXCLUDED.lead_high_intent_threshold,
        custom_rules = EXCLUDED.custom_rules,
        updated_by = EXCLUDED.updated_by,
        updated_at = now()
      RETURNING *
    `;

    const { rows } = await query(sql, [
      organizationId,
      updated.recency_decay_half_life_days,
      updated.frequency_weight,
      updated.recency_weight,
      updated.depth_weight,
      updated.intent_weight,
      updated.lead_cold_threshold,
      updated.lead_warm_threshold,
      updated.lead_hot_threshold,
      updated.lead_high_intent_threshold,
      JSON.stringify(updated.custom_rules || []),
      userId || null,
    ]);

    // Record Audit Log
    await auditService.logAction({
      organizationId,
      actorId: userId,
      action: 'ALGORITHM_CONFIG_UPDATED',
      entityType: 'algorithm_config',
      entityId: organizationId,
      details: { previous: existing, updated: rows[0] },
    });

    return rows[0];
  }
}

export const algorithmConfigService = new AlgorithmConfigService();
