import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

export const leadsRouter = Router();

leadsRouter.use(requireAuth);

// GET /api/leads - List all leads with intelligence data
leadsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { rows: leads } = await query(
      `SELECT l.*, li.behavior_score, li.lead_category, li.total_time_spent, li.total_qr_scans, li.total_ar_sessions
       FROM leads l
       LEFT JOIN lead_intelligence li ON l.id = li.lead_id
       WHERE l.company_id = $1
       ORDER BY li.behavior_score DESC NULLS LAST, l.created_at DESC`,
      [companyId]
    );
    res.json(leads);
  })
);

// GET /api/leads/:id - Get a single lead
leadsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;

    const { rows: leads } = await query(
      `SELECT l.*, li.behavior_score, li.lead_category, li.total_time_spent, 
              li.total_pages_visited, li.total_products_viewed, li.total_qr_scans, 
              li.total_ar_sessions, li.total_downloads
       FROM leads l
       LEFT JOIN lead_intelligence li ON l.id = li.lead_id
       WHERE l.id = $1 AND l.company_id = $2`,
      [id, companyId]
    );

    if (leads.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(leads[0]);
  })
);

// GET /api/leads/:id/journey - Get the chronological visitor journey
leadsRouter.get(
  '/:id/journey',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;

    // Verify lead exists and belongs to company
    const { rows: leads } = await query(
      `SELECT id FROM leads WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    if (leads.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Get chronological journey
    const { rows: journey } = await query(
      `SELECT a.id, a.event_type, a.metadata, a.created_at, p.name as product_name
       FROM analytics_events a
       LEFT JOIN products p ON a.product_id = p.id
       WHERE a.lead_id = $1 AND a.company_id = $2
       ORDER BY a.created_at ASC`,
      [id, companyId]
    );

    res.json(journey);
  })
);

// PUT /api/leads/:id - Update lead status/notes
leadsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;
    const { status, notes } = req.body;

    const { rows: updated } = await query(
      `UPDATE leads 
       SET status = COALESCE($1, status), 
           notes = COALESCE($2, notes),
           updated_at = now()
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [status, notes, id, companyId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(updated[0]);
  })
);
