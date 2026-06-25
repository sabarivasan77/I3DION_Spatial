import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { ApiError } from '../utils/errors.js';

export const leadsRouter = Router();

leadsRouter.use(requireAuth);

// GET /api/leads - List all leads with intelligence data
leadsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { status, priority, search, sortBy = 'score', sortOrder = 'desc', limit = 100, offset = 0 } = req.query;

    let whereClause = 'WHERE l.company_id = $1';
    const params = [companyId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND l.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      whereClause += ` AND l.priority = $${paramCount}`;
      params.push(priority);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (l.name ILIKE $${paramCount} OR l.company ILIKE $${paramCount} OR l.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const validSortBy = { score: 'li.behavior_score', name: 'l.name', date: 'l.created_at', priority: 'l.priority' };
    const orderField = validSortBy[sortBy] || 'li.behavior_score';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const { rows: leads } = await query(
      `SELECT l.*, 
              li.behavior_score as score, 
              li.lead_category as intent_level, 
              li.total_time_spent, 
              li.total_qr_scans, 
              li.total_ar_sessions,
              li.total_products_viewed,
              li.total_downloads,
              (SELECT COUNT(*) FROM analytics_events ae WHERE ae.lead_id = l.id) as total_events,
              u.name as assigned_to_name
       FROM leads l
       LEFT JOIN lead_intelligence li ON l.id = li.lead_id
       LEFT JOIN users u ON l.assigned_to = u.id
       ${whereClause}
       ORDER BY ${orderField} ${orderDir} NULLS LAST, l.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...params, limit, offset]
    );
    res.json(leads);
  })
);

// GET /api/leads/:id - Get a single lead with full details
leadsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;

    const { rows: leads } = await query(
      `SELECT l.*, 
              li.behavior_score as score, 
              li.lead_category as intent_level, 
              li.total_time_spent, 
              li.total_pages_visited, 
              li.total_products_viewed, 
              li.total_qr_scans, 
              li.total_ar_sessions, 
              li.total_downloads,
              u.name as assigned_to_name
       FROM leads l
       LEFT JOIN lead_intelligence li ON l.id = li.lead_id
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = $1 AND l.company_id = $2`,
      [id, companyId]
    );

    if (leads.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(leads[0]);
  })
);

// POST /api/leads - Manual lead creation (requires auth)
leadsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const {
      name, email, phone, company, designation, productId, catalogId,
      status = 'New', source = 'Manual', score = 0, notes, priority = 'Normal'
    } = req.body;

    if (!name || !name.trim()) throw new ApiError(400, 'Lead name is required');
    if (!email || !email.trim()) throw new ApiError(400, 'Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Invalid email address');

    const validStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed', 'Lost'];
    if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status');

    const { rows: created } = await query(
      `INSERT INTO leads (company_id, name, email, phone, company, designation, product_id, catalog_id, status, source, score, notes, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [companyId, name.trim(), email.trim().toLowerCase(), phone || null, company || null, designation || null,
       productId || null, catalogId || null, status, source, score, notes || null, priority]
    );

    const lead = created[0];

    // Initialize lead intelligence record
    await query(
      `INSERT INTO lead_intelligence (lead_id, behavior_score, lead_category)
       VALUES ($1, $2, $3)
       ON CONFLICT (lead_id) DO NOTHING`,
      [lead.id, score, score >= 90 ? 'High Intent' : score >= 76 ? 'SQL' : score >= 51 ? 'Hot' : score >= 26 ? 'Warm' : 'Cold']
    );

    res.status(201).json(lead);
  })
);

// GET /api/leads/:id/journey - Get the chronological visitor journey
leadsRouter.get(
  '/:id/journey',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;

    const { rows: leads } = await query(
      `SELECT id FROM leads WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    if (leads.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

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

// GET /api/leads/:id/activities - Get lead activities/notes
leadsRouter.get(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;

    const { rows: leads } = await query(
      `SELECT id FROM leads WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    if (leads.length === 0) return res.status(404).json({ message: 'Lead not found' });

    const { rows: activities } = await query(
      `SELECT la.*, u.name as user_name FROM lead_activities la
       LEFT JOIN users u ON la.user_id = u.id
       WHERE la.lead_id = $1 AND la.company_id = $2
       ORDER BY la.created_at DESC`,
      [id, companyId]
    );

    res.json(activities);
  })
);

// POST /api/leads/:id/activities - Add a note/activity
leadsRouter.post(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const { companyId, id: userId } = req.user;
    const { id } = req.params;
    const { activityType = 'note', subject, body } = req.body;

    const { rows: leads } = await query(
      `SELECT id FROM leads WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    if (leads.length === 0) return res.status(404).json({ message: 'Lead not found' });

    const { rows: created } = await query(
      `INSERT INTO lead_activities (company_id, lead_id, user_id, activity_type, subject, body)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [companyId, id, userId, activityType, subject || null, body || null]
    );

    res.status(201).json(created[0]);
  })
);

// PUT /api/leads/:id - Update lead status/notes/fields
leadsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;
    const { status, notes, priority, designation, company, phone, assignedTo, name, email, source } = req.body;

    const { rows: updated } = await query(
      `UPDATE leads 
       SET status = COALESCE($1, status), 
           notes = COALESCE($2, notes),
           priority = COALESCE($3, priority),
           designation = COALESCE($4, designation),
           company = COALESCE($5, company),
           phone = COALESCE($6, phone),
           assigned_to = COALESCE($7, assigned_to),
           name = COALESCE($8, name),
           email = COALESCE($9, email),
           source = COALESCE($10, source),
           updated_at = now()
       WHERE id = $11 AND company_id = $12
       RETURNING *`,
      [status, notes, priority, designation, company, phone, assignedTo || null, name, email, source, id, companyId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(updated[0]);
  })
);

// DELETE /api/leads/:id - Delete a lead
leadsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { id } = req.params;

    const { rowCount } = await query(
      `DELETE FROM leads WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(204).end();
  })
);
