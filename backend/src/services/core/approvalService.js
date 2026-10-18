/**
 * Unified Approvals Centre Service (Phase P9)
 * Cross-product approval workflows across Assets, Catalogs, Schemas, Flows, and Quotations.
 */

import { pool } from '../../db/pool.js';
async function logActivity(orgId, userId, userName, action, targetType, targetId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO vault_audit_logs (organization_id, user_id, user_name, action, target_type, target_id, target_name, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [orgId, userId, userName, action, targetType, targetId, targetType, JSON.stringify(details)]
    );
  } catch (err) {
    // Non-blocking audit log
  }
}


export const approvalService = {
  /**
   * List approval requests for organization
   */
  async listApprovals(organizationId, { status = 'All', resourceType } = {}) {
    let sql = `
      SELECT a.*,
             u.name as requested_by_name,
             u.email as requested_by_email,
             r.name as reviewed_by_name
      FROM vault_approval_workflows a
      LEFT JOIN users u ON a.requested_by = u.id
      LEFT JOIN users r ON a.reviewed_by = r.id
      WHERE a.organization_id = $1
    `;
    const params = [organizationId];

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND a.approval_status = $${params.length}`;
    }

    if (resourceType) {
      params.push(resourceType);
      sql += ` AND a.resource_type = $${params.length}`;
    }

    sql += ` ORDER BY a.submitted_at DESC LIMIT 100`;

    const res = await pool.query(sql, params);
    return res.rows;
  },

  /**
   * Submit an item for approval
   */
  async submitForApproval(organizationId, userId, { resourceType, resourceId, versionId = null, notes = '' }) {
    if (!resourceType || !resourceId) {
      throw new Error('resourceType and resourceId are required for approval submission');
    }

    const res = await pool.query(
      `INSERT INTO vault_approval_workflows (
         organization_id, resource_type, resource_id, version_id,
         approval_status, requested_by, review_notes, submitted_at
       ) VALUES ($1, $2, $3, $4, 'PENDING_REVIEW', $5, $6, NOW())
       RETURNING *`,
      [organizationId, resourceType, resourceId, versionId, userId, notes]
    );

    const approval = res.rows[0];

    // Log to audit trail
    await logActivity(
      organizationId,
      userId,
      'System User',
      `Submitted ${resourceType} for approval`,
      'Approval',
      approval.id,
      notes
    ).catch(() => {});

    return approval;
  },

  /**
   * Resolve approval (Approve or Reject)
   */
  async resolveApproval(organizationId, reviewerId, approvalId, { status, notes = '' }) {
    const validStatuses = ['APPROVED', 'REJECTED'];
    const normalizedStatus = (status || '').toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid approval status: ${status}. Must be APPROVED or REJECTED.`);
    }

    const res = await pool.query(
      `UPDATE vault_approval_workflows
       SET approval_status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_notes = COALESCE($3, review_notes)
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [normalizedStatus, reviewerId, notes, approvalId, organizationId]
    );

    if (res.rows.length === 0) {
      throw new Error('Approval workflow not found or unauthorized');
    }

    const updated = res.rows[0];

    // Log audit trail
    await logActivity(
      organizationId,
      reviewerId,
      'Reviewer',
      `Resolved approval for ${updated.resource_type}: ${normalizedStatus}`,
      'Approval',
      approvalId,
      notes
    ).catch(() => {});

    return updated;
  }
};
