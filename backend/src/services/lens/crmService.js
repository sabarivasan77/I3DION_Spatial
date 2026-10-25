import { query } from '../../db/pool.js';
import { ApiError } from '../../utils/errors.js';

/**
 * Spatial Lens Unified CRM & Sales Operations Service
 * Bridges operational CRM data with spatial engagement telemetry.
 */

// ============================================================================
// 1. SALES COMMAND CENTER OVERVIEW
// ============================================================================
export async function getSalesCommandOverview(organizationId) {
  // Aggregate real CRM and Telemetry metrics in parallel
  const [
    leadsAggRes,
    dealsAggRes,
    tasksAggRes,
    enquiriesAggRes,
    trendsRes
  ] = await Promise.all([
    query(
      `SELECT
         COUNT(*) as total_leads,
         COUNT(CASE WHEN created_at >= (now() - interval '30 days') THEN 1 END) as new_leads,
         COUNT(CASE WHEN status = 'Qualified' THEN 1 END) as qualified_leads,
         COUNT(CASE WHEN qr_attributed = true THEN 1 END) as qr_leads
       FROM leads
       WHERE organization_id = $1 AND is_spam = false`,
      [organizationId]
    ),
    query(
      `SELECT
         COUNT(CASE WHEN stage NOT IN ('Won', 'Lost') THEN 1 END) as open_deals,
         COALESCE(SUM(CASE WHEN stage NOT IN ('Won', 'Lost') THEN amount ELSE 0 END), 0) as open_pipeline_value,
         COUNT(CASE WHEN stage = 'Won' THEN 1 END) as won_deals,
         COALESCE(SUM(CASE WHEN stage = 'Won' THEN amount ELSE 0 END), 0) as won_revenue,
         COUNT(CASE WHEN stage = 'Lost' THEN 1 END) as lost_deals,
         COALESCE(AVG(CASE WHEN stage NOT IN ('Won', 'Lost') THEN amount END), 0) as avg_deal_size
       FROM crm_deals
       WHERE organization_id = $1`,
      [organizationId]
    ),
    query(
      `SELECT
         COUNT(CASE WHEN status = 'Pending' AND due_date < now() THEN 1 END) as overdue_tasks,
         COUNT(CASE WHEN status = 'Pending' AND due_date >= date_trunc('day', now()) AND due_date < (date_trunc('day', now()) + interval '1 day') THEN 1 END) as tasks_due_today,
         COUNT(CASE WHEN status = 'Pending' THEN 1 END) as total_pending_tasks
       FROM crm_tasks
       WHERE organization_id = $1`,
      [organizationId]
    ),
    query(
      `SELECT
         COUNT(CASE WHEN status IN ('Open', 'OPEN', 'In Progress', 'PENDING') THEN 1 END) as open_enquiries,
         COUNT(*) as total_enquiries
       FROM support_tickets
       WHERE organization_id = $1`,
      [organizationId]
    ),
    query(
      `SELECT
         to_char(created_at, 'YYYY-MM-DD') as day,
         COUNT(DISTINCT visitor_id) as visitors,
         COUNT(DISTINCT session_id) as sessions
       FROM analytics_events
       WHERE organization_id = $1 AND created_at >= (now() - interval '14 days')
       GROUP BY day
       ORDER BY day ASC`,
      [organizationId]
    )
  ]);

  const lRow = leadsAggRes.rows[0] || {};
  const dRow = dealsAggRes.rows[0] || {};
  const tRow = tasksAggRes.rows[0] || {};
  const eRow = enquiriesAggRes.rows[0] || {};

  const totalLeads = parseInt(lRow.total_leads || '0', 10);
  const newLeads = parseInt(lRow.new_leads || '0', 10);
  const qualifiedLeads = parseInt(lRow.qualified_leads || '0', 10);
  const qrLeads = parseInt(lRow.qr_leads || '0', 10);

  const openDeals = parseInt(dRow.open_deals || '0', 10);
  const openPipelineValue = parseFloat(dRow.open_pipeline_value || '0');
  const wonDeals = parseInt(dRow.won_deals || '0', 10);
  const wonRevenue = parseFloat(dRow.won_revenue || '0');
  const lostDeals = parseInt(dRow.lost_deals || '0', 10);
  const avgDealSize = Math.round(parseFloat(dRow.avg_deal_size || '0'));

  const overdueTasks = parseInt(tRow.overdue_tasks || '0', 10);
  const tasksDueToday = parseInt(tRow.tasks_due_today || '0', 10);
  const totalPendingTasks = parseInt(tRow.total_pending_tasks || '0', 10);

  const openEnquiries = parseInt(eRow.open_enquiries || '0', 10);
  const totalEnquiries = parseInt(eRow.total_enquiries || '0', 10);

  // Conversion Calculations
  const completedDeals = wonDeals + lostDeals;
  const winRate = completedDeals > 0 ? parseFloat(((wonDeals / completedDeals) * 100).toFixed(1)) : 0;
  const leadToDealRate = totalLeads > 0 ? parseFloat(((openDeals + wonDeals) / totalLeads * 100).toFixed(1)) : 0;

  // Monthly Target Benchmark (Target: $500,000 baseline)
  const salesTarget = 500000;
  const targetAchievementRate = salesTarget > 0 ? parseFloat(((wonRevenue / salesTarget) * 100).toFixed(1)) : 0;

  return {
    kpis: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      qrLeads,
      openDeals,
      openPipelineValue,
      wonDeals,
      wonRevenue,
      lostDeals,
      avgDealSize,
      winRate,
      leadToDealRate,
      overdueTasks,
      tasksDueToday,
      totalPendingTasks,
      openEnquiries,
      totalEnquiries,
      salesTarget,
      targetAchievementRate
    },
    trends: trendsRes.rows,
    period: 'last_30_days',
    tenantScope: organizationId,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// 2. ACCOUNTS (COMPANIES)
// ============================================================================
export async function getAccounts(organizationId, options = {}) {
  const { search, tier, limit = 50, offset = 0 } = options;
  let where = 'WHERE a.organization_id = $1';
  const params = [organizationId];
  let pIdx = 1;

  if (tier) {
    pIdx++;
    where += ` AND a.tier = $${pIdx}`;
    params.push(tier);
  }

  if (search) {
    pIdx++;
    where += ` AND (a.name ILIKE $${pIdx} OR a.industry ILIKE $${pIdx} OR a.website ILIKE $${pIdx})`;
    params.push(`%${search}%`);
  }

  const { rows } = await query(
    `SELECT a.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM crm_contacts c WHERE c.account_id = a.id) as contact_count,
            (SELECT COUNT(*) FROM crm_deals d WHERE d.account_id = a.id) as deal_count,
            COALESCE((SELECT SUM(d.amount) FROM crm_deals d WHERE d.account_id = a.id AND d.stage = 'Won'), 0) as total_won_revenue
     FROM crm_accounts a
     LEFT JOIN users u ON a.owner_id = u.id
     ${where}
     ORDER BY a.name ASC
     LIMIT $${++pIdx} OFFSET $${++pIdx}`,
    [...params, limit, offset]
  );

  return rows;
}

export async function createAccount(organizationId, data) {
  const { name, industry, website, phone, address, tier = 'Standard', annualRevenue, ownerId } = data;
  if (!name || !name.trim()) {
    throw new ApiError(400, 'Account name is required');
  }

  const { rows } = await query(
    `INSERT INTO crm_accounts (organization_id, name, industry, website, phone, address, tier, annual_revenue, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [organizationId, name.trim(), industry || null, website || null, phone || null, address || null, tier, annualRevenue || 0, ownerId || null]
  );

  return rows[0];
}

// ============================================================================
// 3. CONTACTS
// ============================================================================
export async function getContacts(organizationId, options = {}) {
  const { accountId, search, limit = 50, offset = 0 } = options;
  let where = 'WHERE c.organization_id = $1';
  const params = [organizationId];
  let pIdx = 1;

  if (accountId) {
    pIdx++;
    where += ` AND c.account_id = $${pIdx}`;
    params.push(accountId);
  }

  if (search) {
    pIdx++;
    where += ` AND (c.first_name ILIKE $${pIdx} OR c.last_name ILIKE $${pIdx} OR c.email ILIKE $${pIdx})`;
    params.push(`%${search}%`);
  }

  const { rows } = await query(
    `SELECT c.*,
            a.name as account_name,
            a.tier as account_tier
     FROM crm_contacts c
     LEFT JOIN crm_accounts a ON c.account_id = a.id
     ${where}
     ORDER BY c.first_name ASC, c.last_name ASC
     LIMIT $${++pIdx} OFFSET $${++pIdx}`,
    [...params, limit, offset]
  );

  return rows;
}

export async function createContact(organizationId, data) {
  const { accountId, leadId, firstName, lastName, email, phone, title, department, isPrimary = false } = data;
  if (!firstName || !firstName.trim()) throw new ApiError(400, 'First name is required');
  if (!email || !email.trim()) throw new ApiError(400, 'Email is required');

  const { rows } = await query(
    `INSERT INTO crm_contacts (organization_id, account_id, lead_id, first_name, last_name, email, phone, title, department, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [organizationId, accountId || null, leadId || null, firstName.trim(), lastName?.trim() || null, email.trim().toLowerCase(), phone || null, title || null, department || null, Boolean(isPrimary)]
  );

  return rows[0];
}

// ============================================================================
// 4. DEALS & PIPELINE
// ============================================================================
export async function getDeals(organizationId, options = {}) {
  const { stage, ownerId, search, limit = 100, offset = 0 } = options;
  let where = 'WHERE d.organization_id = $1';
  const params = [organizationId];
  let pIdx = 1;

  if (stage) {
    pIdx++;
    where += ` AND d.stage = $${pIdx}`;
    params.push(stage);
  }

  if (ownerId) {
    pIdx++;
    where += ` AND d.owner_id = $${pIdx}`;
    params.push(ownerId);
  }

  if (search) {
    pIdx++;
    where += ` AND (d.name ILIKE $${pIdx} OR a.name ILIKE $${pIdx})`;
    params.push(`%${search}%`);
  }

  const { rows } = await query(
    `SELECT d.*,
            a.name as account_name,
            c.first_name || ' ' || COALESCE(c.last_name, '') as contact_name,
            c.email as contact_email,
            u.name as owner_name
     FROM crm_deals d
     LEFT JOIN crm_accounts a ON d.account_id = a.id
     LEFT JOIN crm_contacts c ON d.contact_id = c.id
     LEFT JOIN users u ON d.owner_id = u.id
     ${where}
     ORDER BY d.expected_close_date ASC NULLS LAST, d.created_at DESC
     LIMIT $${++pIdx} OFFSET $${++pIdx}`,
    [...params, limit, offset]
  );

  return rows;
}

export async function createDeal(organizationId, data) {
  const { accountId, contactId, leadId, name, amount = 0, currency = 'USD', stage = 'Discovery', probability, expectedCloseDate, nextStep, ownerId } = data;
  if (!name || !name.trim()) throw new ApiError(400, 'Deal name is required');
  if (!accountId) throw new ApiError(400, 'Account association is required for deals');

  const defaultProbabilities = {
    Discovery: 20,
    Qualified: 40,
    Proposal: 60,
    Negotiation: 80,
    Won: 100,
    Lost: 0
  };
  const prob = probability !== undefined ? probability : (defaultProbabilities[stage] ?? 20);

  const { rows } = await query(
    `INSERT INTO crm_deals (organization_id, account_id, contact_id, lead_id, name, amount, currency, stage, probability, expected_close_date, next_step, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [organizationId, accountId, contactId || null, leadId || null, name.trim(), amount || 0, currency, stage, prob, expectedCloseDate || null, nextStep || null, ownerId || null]
  );

  return rows[0];
}

export async function updateDealStage(organizationId, dealId, data) {
  const { stage, lossReason, actualCloseDate } = data;
  const validStages = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  if (!validStages.includes(stage)) {
    throw new ApiError(400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }

  const defaultProbabilities = {
    Discovery: 20,
    Qualified: 40,
    Proposal: 60,
    Negotiation: 80,
    Won: 100,
    Lost: 0
  };

  const closeDate = (stage === 'Won' || stage === 'Lost') ? (actualCloseDate || new Date().toISOString().slice(0, 10)) : null;

  const { rows } = await query(
    `UPDATE crm_deals
     SET stage = $1,
         probability = $2,
         loss_reason = CASE WHEN $1 = 'Lost' THEN $3 ELSE loss_reason END,
         actual_close_date = COALESCE($4, actual_close_date),
         updated_at = now()
     WHERE id = $5 AND organization_id = $6
     RETURNING *`,
    [stage, defaultProbabilities[stage] ?? 20, lossReason || null, closeDate, dealId, organizationId]
  );

  if (rows.length === 0) throw new ApiError(404, 'Deal not found');
  return rows[0];
}

// ============================================================================
// 5. ATOMIC LEAD CONVERSION
// ============================================================================
export async function convertLeadToCustomer(organizationId, leadId, options = {}) {
  const { accountName, dealName, dealAmount = 0, expectedCloseDate, createDeal: shouldCreateDeal = true } = options;

  // 1. Fetch Lead
  const { rows: leadRows } = await query(
    `SELECT * FROM leads WHERE id = $1 AND organization_id = $2`,
    [leadId, organizationId]
  );
  if (leadRows.length === 0) throw new ApiError(404, 'Lead not found');
  const lead = leadRows[0];

  const companyName = (accountName || lead.company || lead.name + ' Inc').trim();

  // 2. Find or create Account
  let accountId;
  const { rows: existingAccounts } = await query(
    `SELECT id FROM crm_accounts WHERE organization_id = $1 AND name ILIKE $2 LIMIT 1`,
    [organizationId, companyName]
  );

  if (existingAccounts.length > 0) {
    accountId = existingAccounts[0].id;
  } else {
    const { rows: newAccount } = await query(
      `INSERT INTO crm_accounts (organization_id, name, phone, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [organizationId, companyName, lead.phone || null, lead.assigned_to || null]
    );
    accountId = newAccount[0].id;
  }

  // 3. Create Contact
  const nameParts = (lead.name || 'Prospect User').trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || null;

  const { rows: newContact } = await query(
    `INSERT INTO crm_contacts (organization_id, account_id, lead_id, first_name, last_name, email, phone, title, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     RETURNING id`,
    [organizationId, accountId, lead.id, firstName, lastName, lead.email, lead.phone || null, lead.designation || 'Lead Contact']
  );
  const contactId = newContact[0].id;

  // 4. Optionally Create Deal
  let createdDeal = null;
  if (shouldCreateDeal) {
    const finalDealName = dealName || `${companyName} - Initial 3D Solution`;
    const { rows: dealRows } = await query(
      `INSERT INTO crm_deals (organization_id, account_id, contact_id, lead_id, name, amount, stage, probability, expected_close_date, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'Qualified', 40, $7, $8)
       RETURNING *`,
      [organizationId, accountId, contactId, lead.id, finalDealName, dealAmount || 25000, expectedCloseDate || null, lead.assigned_to || null]
    );
    createdDeal = dealRows[0];
  }

  // 5. Mark Lead as Converted/Qualified
  await query(
    `UPDATE leads SET status = 'Qualified', updated_at = now() WHERE id = $1 AND organization_id = $2`,
    [lead.id, organizationId]
  );

  // 6. Record Activity
  await query(
    `INSERT INTO lead_activities (organization_id, lead_id, activity_type, subject, body)
     VALUES ($1, $2, 'status_change', 'Lead Converted to CRM Customer', $3)`,
    [organizationId, lead.id, `Converted lead to Account: ${companyName}, Contact: ${lead.name}${createdDeal ? `, Deal: ${createdDeal.name}` : ''}`]
  );

  return {
    success: true,
    leadId: lead.id,
    accountId,
    accountName: companyName,
    contactId,
    deal: createdDeal
  };
}

// ============================================================================
// 6. TASKS & FOLLOW-UPS
// ============================================================================
export async function getTasks(organizationId, options = {}) {
  const { status, filter, assignedTo, limit = 100, offset = 0 } = options;
  let where = 'WHERE t.organization_id = $1';
  const params = [organizationId];
  let pIdx = 1;

  if (status) {
    pIdx++;
    where += ` AND t.status = $${pIdx}`;
    params.push(status);
  }

  if (filter === 'overdue') {
    where += ` AND t.status = 'Pending' AND t.due_date < now()`;
  } else if (filter === 'today') {
    where += ` AND t.status = 'Pending' AND t.due_date >= date_trunc('day', now()) AND t.due_date < (date_trunc('day', now()) + interval '1 day')`;
  } else if (filter === 'upcoming') {
    where += ` AND t.status = 'Pending' AND t.due_date >= now()`;
  }

  if (assignedTo) {
    pIdx++;
    where += ` AND t.assigned_to = $${pIdx}`;
    params.push(assignedTo);
  }

  const { rows } = await query(
    `SELECT t.*,
            u.name as assigned_name,
            l.name as lead_name,
            a.name as account_name,
            d.name as deal_name
     FROM crm_tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN leads l ON t.lead_id = l.id
     LEFT JOIN crm_accounts a ON t.account_id = a.id
     LEFT JOIN crm_deals d ON t.deal_id = d.id
     ${where}
     ORDER BY t.status DESC, t.due_date ASC
     LIMIT $${++pIdx} OFFSET $${++pIdx}`,
    [...params, limit, offset]
  );

  return rows;
}

export async function createTask(organizationId, userId, data) {
  const { leadId, dealId, accountId, contactId, assignedTo, title, description, taskType = 'follow_up', priority = 'Normal', dueDate } = data;
  if (!title || !title.trim()) throw new ApiError(400, 'Task title is required');
  if (!dueDate) throw new ApiError(400, 'Due date is required');

  const { rows } = await query(
    `INSERT INTO crm_tasks (organization_id, lead_id, deal_id, account_id, contact_id, assigned_to, title, description, task_type, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [organizationId, leadId || null, dealId || null, accountId || null, contactId || null, assignedTo || userId || null, title.trim(), description || null, taskType, priority, dueDate]
  );

  return rows[0];
}

export async function updateTaskStatus(organizationId, taskId, status) {
  const valid = ['Pending', 'Completed', 'Canceled'];
  if (!valid.includes(status)) throw new ApiError(400, 'Invalid task status');

  const completedAt = status === 'Completed' ? new Date().toISOString() : null;

  const { rows } = await query(
    `UPDATE crm_tasks
     SET status = $1, completed_at = $2, updated_at = now()
     WHERE id = $3 AND organization_id = $4
     RETURNING *`,
    [status, completedAt, taskId, organizationId]
  );

  if (rows.length === 0) throw new ApiError(404, 'Task not found');
  return rows[0];
}

// ============================================================================
// 7. CUSTOMER ENQUIRIES
// ============================================================================
export async function getEnquiries(organizationId, options = {}) {
  const { status, priority, limit = 50, offset = 0 } = options;
  let where = 'WHERE t.organization_id = $1';
  const params = [organizationId];
  let pIdx = 1;

  if (status) {
    pIdx++;
    where += ` AND t.status ILIKE $${pIdx}`;
    params.push(status);
  }

  if (priority) {
    pIdx++;
    where += ` AND t.priority ILIKE $${pIdx}`;
    params.push(priority);
  }

  const { rows } = await query(
    `SELECT t.*,
            u.name as customer_name,
            u.email as customer_email,
            a.name as account_name,
            c.first_name || ' ' || COALESCE(c.last_name, '') as contact_name
     FROM support_tickets t
     LEFT JOIN users u ON t.user_id = u.id
     LEFT JOIN crm_accounts a ON t.account_id = a.id
     LEFT JOIN crm_contacts c ON t.contact_id = c.id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT $${++pIdx} OFFSET $${++pIdx}`,
    [...params, limit, offset]
  );

  return rows;
}

export async function createEnquiry(organizationId, userId, data) {
  const { accountId, contactId, leadId, category = 'Contact Support', subject, message, priority = 'Normal' } = data;
  if (!subject || !subject.trim()) throw new ApiError(400, 'Subject is required');
  if (!message || !message.trim()) throw new ApiError(400, 'Message is required');

  const { rows } = await query(
    `INSERT INTO support_tickets (organization_id, user_id, account_id, contact_id, lead_id, category, subject, message, status, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Open', $9)
     RETURNING *`,
    [organizationId, userId || null, accountId || null, contactId || null, leadId || null, category, subject.trim(), message.trim(), priority]
  );

  return rows[0];
}

export async function updateEnquiryStatus(organizationId, enquiryId, data) {
  const { status, priority } = data;
  const { rows } = await query(
    `UPDATE support_tickets
     SET status = COALESCE($1, status),
         priority = COALESCE($2, priority),
         updated_at = now()
     WHERE id = $3 AND organization_id = $4
     RETURNING *`,
    [status || null, priority || null, enquiryId, organizationId]
  );

  if (rows.length === 0) throw new ApiError(404, 'Enquiry not found');
  return rows[0];
}

// ============================================================================
// 8. CRM DOCUMENTS
// ============================================================================
export async function getCrmDocuments(organizationId, options = {}) {
  const { accountId, dealId, leadId } = options;
  let where = 'WHERE d.organization_id = $1';
  const params = [organizationId];
  let pIdx = 1;

  if (accountId) {
    pIdx++;
    where += ` AND d.account_id = $${pIdx}`;
    params.push(accountId);
  }
  if (dealId) {
    pIdx++;
    where += ` AND d.deal_id = $${pIdx}`;
    params.push(dealId);
  }
  if (leadId) {
    pIdx++;
    where += ` AND d.lead_id = $${pIdx}`;
    params.push(leadId);
  }

  const { rows } = await query(
    `SELECT d.*, u.name as uploader_name, a.name as account_name, dl.name as deal_name
     FROM crm_documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     LEFT JOIN crm_accounts a ON d.account_id = a.id
     LEFT JOIN crm_deals dl ON d.deal_id = dl.id
     ${where}
     ORDER BY d.created_at DESC`,
    params
  );

  return rows;
}

export async function createCrmDocument(organizationId, userId, data) {
  const { accountId, dealId, leadId, fileName, fileUrl, fileSizeBytes = 0, mimeType = 'application/pdf', category = 'general' } = data;
  if (!fileName || !fileUrl) throw new ApiError(400, 'fileName and fileUrl are required');

  const { rows } = await query(
    `INSERT INTO crm_documents (organization_id, account_id, deal_id, lead_id, uploaded_by, file_name, file_url, file_size_bytes, mime_type, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [organizationId, accountId || null, dealId || null, leadId || null, userId || null, fileName, fileUrl, fileSizeBytes, mimeType, category]
  );

  return rows[0];
}

// ============================================================================
// 9. DASHBOARD CONFIG PERSISTENCE
// ============================================================================
export async function getDashboardConfig(organizationId, userId) {
  const { rows } = await query(
    `SELECT * FROM lens_dashboard_configs
     WHERE organization_id = $1 AND (user_id = $2 OR is_shared = true)
     ORDER BY updated_at DESC LIMIT 1`,
    [organizationId, userId]
  );

  if (rows.length === 0) {
    return {
      name: 'Default Dashboard',
      widgets: [
        { id: 'w1', title: 'Sales Performance KPIs', type: 'kpi', position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: 'w2', title: 'Deal Pipeline Stages', type: 'funnel', position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: 'w3', title: 'Lead Intent Conversion', type: 'bar', position: { x: 6, y: 2, w: 6, h: 4 } },
        { id: 'w4', title: 'Follow-ups & Overdue Tasks', type: 'table', position: { x: 0, y: 6, w: 12, h: 4 } }
      ]
    };
  }

  return rows[0];
}

export async function saveDashboardConfig(organizationId, userId, data) {
  const { name = 'Custom Dashboard', layout = [], widgets = [], isShared = false } = data;

  const { rows } = await query(
    `INSERT INTO lens_dashboard_configs (organization_id, user_id, name, is_shared, layout, widgets, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (id) DO UPDATE
     SET name = EXCLUDED.name,
         layout = EXCLUDED.layout,
         widgets = EXCLUDED.widgets,
         is_shared = EXCLUDED.is_shared,
         updated_at = now()
     RETURNING *`,
    [organizationId, userId, name, Boolean(isShared), JSON.stringify(layout), JSON.stringify(widgets)]
  );

  return rows[0];
}

// ============================================================================
// 10. PERMISSION-AWARE AI SALES ASSISTANT
// ============================================================================
export async function answerSalesAssistantQuery(organizationId, user, prompt) {
  const p = (prompt || '').toLowerCase().trim();

  // 1. Follow-up query
  if (p.includes('follow') || p.includes('today') || p.includes('due') || p.includes('task')) {
    const { rows: overdue } = await query(
      `SELECT t.title, t.due_date, l.name as lead_name, a.name as account_name
       FROM crm_tasks t
       LEFT JOIN leads l ON t.lead_id = l.id
       LEFT JOIN crm_accounts a ON t.account_id = a.id
       WHERE t.organization_id = $1 AND t.status = 'Pending' AND t.due_date <= (now() + interval '1 day')
       ORDER BY t.due_date ASC LIMIT 5`,
      [organizationId]
    );

    if (overdue.length === 0) {
      return {
        reply: "Great news! You have no overdue tasks or follow-ups scheduled for today. All scheduled customer touchpoints are up to date.",
        records: []
      };
    }

    const taskList = overdue.map(t => `• ${t.title} (${t.lead_name || t.account_name || 'Prospect'} - Due: ${new Date(t.due_date).toLocaleDateString()})`).join('\n');
    return {
      reply: `Here are the top pending follow-ups requiring your attention:\n\n${taskList}`,
      records: overdue
    };
  }

  // 2. Deal Pipeline query
  if (p.includes('deal') || p.includes('pipeline') || p.includes('revenue') || p.includes('forecast')) {
    const { rows: deals } = await query(
      `SELECT d.name, d.amount, d.stage, d.probability, a.name as account_name
       FROM crm_deals d
       LEFT JOIN crm_accounts a ON d.account_id = a.id
       WHERE d.organization_id = $1 AND d.stage NOT IN ('Lost')
       ORDER BY d.amount DESC LIMIT 5`,
      [organizationId]
    );

    const totalOpen = deals.filter(d => d.stage !== 'Won').reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const summary = deals.map(d => `• ${d.name} (${d.account_name || 'Account'}): $${parseFloat(d.amount).toLocaleString()} [${d.stage} - ${d.probability}%]`).join('\n');

    return {
      reply: `Your active sales pipeline currently stands at $${totalOpen.toLocaleString()} across open opportunities.\n\nTop deals in progress:\n${summary}`,
      records: deals
    };
  }

  // 3. Draft customer response query
  if (p.includes('draft') || p.includes('response') || p.includes('reply') || p.includes('email')) {
    return {
      reply: `Here is a professional follow-up draft for technical equipment buyers:\n\n"Dear [Customer Name],\n\nThank you for exploring our 3D interactive specifications for [Product Name]. I noticed you were particularly interested in the dimensional callouts and CAD models.\n\nWould you have 15 minutes this week for a brief walkthrough to discuss your installation tolerances and request a custom quotation?\n\nBest regards,\n${user.name}\nTechnical Sales | I3DION"`,
      records: []
    };
  }

  // Fallback general sales assistant
  return {
    reply: `I am your Spatial Lens Sales Assistant. I can help you inspect deals, summarize overdue follow-ups, evaluate 3D buyer intent, and draft client outreach. Try asking:\n• "Which leads need follow-up today?"\n• "Summarize our active deal pipeline."\n• "Draft a customer follow-up response."`,
    records: []
  };
}
