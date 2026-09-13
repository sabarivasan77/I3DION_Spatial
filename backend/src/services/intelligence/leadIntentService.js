import { query } from '../../db/pool.js';

export class LeadIntentService {
  /**
   * Evaluates the commercial intent level for a visitor/user/lead.
   */
  async evaluateIntent({ organizationId, leadId = null, userId = null, visitorId = null }) {
    if (!organizationId) {
      throw new Error('organizationId required for intent evaluation');
    }

    let eventCondition = 'organization_id = $1';
    const params = [organizationId];

    if (leadId) {
      params.push(leadId);
      eventCondition += ` AND lead_id = $${params.length}`;
    } else if (userId) {
      params.push(userId);
      eventCondition += ` AND user_id = $${params.length}`;
    } else if (visitorId) {
      params.push(visitorId);
      eventCondition += ` AND visitor_id = $${params.length}`;
    } else {
      return { intentLevel: 'LOW', intentScore: 0, signals: [] };
    }

    const sql = `
      SELECT event_type, metadata, created_at
      FROM analytics_events
      WHERE ${eventCondition}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const { rows: events } = await query(sql, params);

    let score = 0;
    const signals = [];

    for (const e of events) {
      switch (e.event_type) {
        case 'quote_request':
        case 'contact_sales':
          score += 40;
          signals.push('Commercial quote/sales contact requested');
          break;
        case 'brochure_download':
        case 'model_download':
          score += 15;
          signals.push('Technical document/CAD downloaded');
          break;
        case 'ar_launch':
        case 'ar_session':
          score += 10;
          signals.push('WebXR 1:1 scale AR launched');
          break;
        case 'specification_view':
          score += 8;
          signals.push('Inspected technical specifications');
          break;
        case 'model_rotation':
        case 'model_interaction':
          score += 5;
          signals.push('Interacted with 3D model geometry');
          break;
        case 'product_view':
          score += 3;
          break;
      }
    }

    const normalizedScore = Math.min(100, score);

    let intentLevel = 'LOW';
    if (normalizedScore >= 75) {
      intentLevel = 'VERY_HIGH';
    } else if (normalizedScore >= 50) {
      intentLevel = 'HIGH';
    } else if (normalizedScore >= 25) {
      intentLevel = 'MEDIUM';
    }

    return {
      intentLevel,
      intentScore: normalizedScore,
      signals: Array.from(new Set(signals)),
    };
  }
}

export const leadIntentService = new LeadIntentService();
