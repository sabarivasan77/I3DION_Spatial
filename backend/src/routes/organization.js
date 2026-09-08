import express from 'express';
import crypto from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { requirePermission } from '../middleware/permissions.js';
import { enforceQuota } from '../middleware/entitlement.js';
import { pool } from '../db/pool.js';
import { usageService } from '../services/usage/usageService.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenant);

/**
 * GET /api/v1/organization
 * Get current organization profile and member list
 */
router.get('/', async (req, res, next) => {
  try {
    const orgRes = await pool.query(`SELECT * FROM organizations WHERE id = $1`, [req.organizationId]);
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ error: 'ORG_NOT_FOUND', message: 'Organization not found' });
    }

    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at
       FROM users u
       WHERE u.organization_id = $1
       ORDER BY u.created_at ASC`,
      [req.organizationId]
    );

    const invRes = await pool.query(
      `SELECT id, email, role, created_at, expires_at
       FROM organization_invitations
       WHERE organization_id = $1 AND accepted_at IS NULL AND expires_at > now()`,
      [req.organizationId]
    );

    res.json({
      organization: orgRes.rows[0],
      members: membersRes.rows,
      pendingInvitations: invRes.rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/organization
 * Update organization profile and primary brand colors
 */
router.put('/', requirePermission('organization.manage'), async (req, res, next) => {
  try {
    const { name, website, primary_color, logo_url } = req.body;

    const updated = await pool.query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           website = COALESCE($2, website),
           primary_color = COALESCE($3, primary_color),
           logo_url = COALESCE($4, logo_url),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [name, website, primary_color, logo_url, req.organizationId]
    );

    res.json({ organization: updated.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/organization/invitations
 * Invite a new team member to the organization
 */
router.post('/invitations', requirePermission('organization.members.manage'), enforceQuota('team_members'), async (req, res, next) => {
  try {
    const { email, role = 'Sales User' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'EMAIL_REQUIRED', message: 'Recipient email is required' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const inv = await pool.query(
      `INSERT INTO organization_invitations (organization_id, email, role, token, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, email) DO UPDATE SET
         role = EXCLUDED.role,
         token = EXCLUDED.token,
         expires_at = now() + interval '7 days',
         accepted_at = NULL
       RETURNING *`,
      [req.organizationId, email, role, token, req.user.id]
    );

    res.json({ success: true, invitation: inv.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/organization/members/:userId
 * Remove team member from organization
 */
router.delete('/members/:userId', requirePermission('organization.members.manage'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'CANNOT_REMOVE_SELF', message: 'You cannot remove yourself from the organization.' });
    }

    await pool.query(`UPDATE users SET organization_id = NULL WHERE id = $1 AND organization_id = $2`, [userId, req.organizationId]);
    await usageService.syncOrganizationUsage(req.organizationId);

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
