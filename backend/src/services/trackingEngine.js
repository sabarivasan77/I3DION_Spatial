import { query } from '../db/pool.js';
import { recalculateLeadScore } from './scoringEngine.js';

/**
 * Tracks an analytics event.
 * If the event provides user info (like email) and the visitor is not yet a lead, it creates one.
 */
export async function trackEvent({ organizationId, visitorId, eventType, metadata = {}, productId = null, catalogId = null, leadId = null }) {
  let finalLeadId = leadId;

  // 1. Resolve Lead ID
  // If no leadId provided but we have visitorId, see if this visitor is already associated with a lead
  if (!finalLeadId && visitorId) {
    const { rows } = await query(
      `SELECT lead_id FROM analytics_events WHERE visitor_id = $1 AND lead_id IS NOT NULL AND organization_id = $2 LIMIT 1`,
      [visitorId, organizationId]
    );
    if (rows.length > 0) {
      finalLeadId = rows[0].lead_id;
    }
  }

  // 2. Auto-Convert Visitor to Lead on High Intent Actions
  const isIdentifyingEvent = ['user_register', 'user_login', 'quote_request', 'brochure_download'].includes(eventType);
  if (!finalLeadId && visitorId && isIdentifyingEvent && metadata.email) {
    // Check if lead already exists with this email
    let leadResult = await query(
      `SELECT id FROM leads WHERE email = $1 AND organization_id = $2`,
      [metadata.email, organizationId]
    );

    if (leadResult.rows.length > 0) {
      finalLeadId = leadResult.rows[0].id;
    } else {
      // Create new lead
      const name = metadata.name || metadata.email.split('@')[0];
      const source = eventType === 'quote_request' ? 'Quote Request' : (eventType === 'user_register' ? 'Registration' : 'Website');
      
      leadResult = await query(
        `INSERT INTO leads (organization_id, product_id, catalog_id, name, email, phone, company, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'New', $8)
         RETURNING id`,
        [
          organizationId,
          productId,
          catalogId,
          name,
          metadata.email,
          metadata.phone || null,
          metadata.company || null,
          source
        ]
      );
      finalLeadId = leadResult.rows[0].id;
    }

    // Back-associate all previous anonymous events for this visitor to the new lead
    await query(
      `UPDATE analytics_events SET lead_id = $1 WHERE visitor_id = $2 AND lead_id IS NULL AND organization_id = $3`,
      [finalLeadId, visitorId, organizationId]
    );
    await query(
      `UPDATE viewer_sessions SET lead_id = $1 WHERE visitor_id = $2 AND lead_id IS NULL AND organization_id = $3`,
      [finalLeadId, visitorId, organizationId]
    );
  }

  // 3. Insert the Event
  const { rows: insertedEvent } = await query(
    `INSERT INTO analytics_events (organization_id, product_id, catalog_id, lead_id, visitor_id, event_type, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [organizationId, productId, catalogId, finalLeadId, visitorId, eventType, metadata]
  );

  // 4. Trigger Lead Scoring if associated with a lead
  if (finalLeadId) {
    // Run asynchronously to not block tracking response
    recalculateLeadScore(finalLeadId, organizationId).catch(err => {
      console.error('Error recalculating lead score:', err);
    });
  }

  return insertedEvent[0];
}
