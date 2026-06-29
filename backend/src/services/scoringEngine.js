import { query } from '../db/pool.js';

export const SCORE_WEIGHTS = {
  user_register: 30,
  user_login: 10,
  page_view: 1,
  product_view: 2, // Modified
  catalog_view: 2,
  qr_scan: 10,
  ar_launch: 10, // Modified
  ar_session: 5,
  brochure_download: 8, // Modified (PDF)
  model_download: 15, // New
  quote_request: 50, // Modified
  contact_sales: 60, // New
  specification_view: 4, // New
  return_visit: 15, // New
  time_spent: 0, // Calculated separately
  button_click: 1,
  model_rotation: 2,
  hotspot_view: 2,
  animation_play: 5 // Modified
};

export function getLeadCategory(score) {
  if (score >= 100) return 'Sales Ready';
  if (score >= 70) return 'Qualified';
  if (score >= 40) return 'Hot';
  if (score >= 20) return 'Warm';
  return 'Cold';
}

export async function recalculateLeadScore(leadId, companyId) {
  // 1. Get all events for the lead
  const { rows: events } = await query(
    `SELECT event_type, metadata FROM analytics_events WHERE lead_id = $1 AND company_id = $2`,
    [leadId, companyId]
  );

  let behavior_score = 0;
  let total_time_spent = 0;
  let total_pages_visited = 0;
  let total_products_viewed = 0;
  let total_qr_scans = 0;
  let total_ar_sessions = 0;
  let total_downloads = 0;

  for (const event of events) {
    const weight = SCORE_WEIGHTS[event.event_type] || 0;
    behavior_score += weight;

    switch (event.event_type) {
      case 'page_view':
        total_pages_visited++;
        break;
      case 'product_view':
        total_products_viewed++;
        break;
      case 'qr_scan':
        total_qr_scans++;
        break;
      case 'ar_session':
        total_ar_sessions++;
        if (event.metadata && event.metadata.durationSeconds) {
          total_time_spent += event.metadata.durationSeconds;
          behavior_score += Math.floor(event.metadata.durationSeconds / 60); // 1 pt per minute
        }
        break;
      case 'time_spent':
        if (event.metadata && event.metadata.durationSeconds) {
          total_time_spent += event.metadata.durationSeconds;
          behavior_score += Math.floor(event.metadata.durationSeconds / 60);
        }
        break;
      case 'brochure_download':
      case 'model_download':
        total_downloads++;
        break;
    }
  }

  // Cap score at 100 for percentage representation
  const normalized_score = Math.min(100, behavior_score);
  const lead_category = getLeadCategory(normalized_score);

  // 2. Upsert into lead_intelligence
  await query(
    `INSERT INTO lead_intelligence (
      lead_id, behavior_score, total_time_spent, total_pages_visited, 
      total_products_viewed, total_qr_scans, total_ar_sessions, total_downloads, lead_category
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (lead_id) DO UPDATE SET
      behavior_score = EXCLUDED.behavior_score,
      total_time_spent = EXCLUDED.total_time_spent,
      total_pages_visited = EXCLUDED.total_pages_visited,
      total_products_viewed = EXCLUDED.total_products_viewed,
      total_qr_scans = EXCLUDED.total_qr_scans,
      total_ar_sessions = EXCLUDED.total_ar_sessions,
      total_downloads = EXCLUDED.total_downloads,
      lead_category = EXCLUDED.lead_category,
      updated_at = now()`,
    [
      leadId,
      normalized_score,
      total_time_spent,
      total_pages_visited,
      total_products_viewed,
      total_qr_scans,
      total_ar_sessions,
      total_downloads,
      lead_category
    ]
  );

  // Also update the score on the leads table for quick access
  await query(
    `UPDATE leads SET score = $1, status = CASE WHEN $1 >= 50 AND status = 'New' THEN 'Qualified'::lead_status ELSE status END WHERE id = $2`,
    [normalized_score, leadId]
  );

  return { normalized_score, lead_category };
}
