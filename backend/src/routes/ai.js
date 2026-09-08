import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { recommendationEngine } from '../services/recommendationEngine.js';
import { salesAssistant } from '../services/salesAssistant.js';

export const aiRouter = Router();

// Allow some public routes or use requireAuth for all?
// The landing page personalization needs to work for public (via visitor_id/session_id)
// We can use an optionalAuth middleware, but for now we'll allow it public and read from headers.

aiRouter.get('/recommendations', asyncHandler(async (req, res) => {
  // If user is authenticated, use their organizationId, otherwise expect it from query/header
  const organizationId = req.user?.organizationId || req.query.organizationId;
  const sessionId = req.headers['x-visitor-id'] || req.query.sessionId || 'anonymous';

  if (!organizationId) {
    return res.status(400).json({ message: 'Missing company ID for recommendations' });
  }

  const recommendations = await recommendationEngine.getHybridRecommendations(organizationId, sessionId);
  res.json({ recommendations });
}));

aiRouter.get('/frequently-viewed', asyncHandler(async (req, res) => {
  const organizationId = req.user?.organizationId || req.query.organizationId;
  const productId = req.query.productId;

  if (!organizationId || !productId) {
    return res.status(400).json({ message: 'Missing company ID or product ID' });
  }

  const items = await recommendationEngine.getFrequentlyViewedTogether(organizationId, productId);
  res.json({ items });
}));

// Sales Assistant Insights (Requires Auth)
aiRouter.get('/insights', requireAuth, asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const insights = await salesAssistant.getInsights(organizationId);
  res.json({ insights });
}));

// AI Dashboard Metrics (Requires Auth)
aiRouter.get('/dashboard', requireAuth, asyncHandler(async (req, res) => {
  const { query } = await import('../db/pool.js');
  const organizationId = req.user.organizationId;
  
  const metricsRes = await query(`
    SELECT status, COUNT(*) as count 
    FROM ml_models 
    GROUP BY status
  `);

  const activeModelRes = await query(`
    SELECT name, version, metrics, updated_at
    FROM ml_models
    WHERE status = 'Active'
  `);

  res.json({
    model_stats: metricsRes.rows,
    active_models: activeModelRes.rows
  });
}));

// POST /api/ai/assistant/chat - Permission-Aware Workspace Assistant
aiRouter.post('/assistant/chat', requireAuth, asyncHandler(async (req, res) => {
  const { message } = req.body;
  const user = req.user;
  const prompt = (message || '').toLowerCase();

  let reply = "I'm your I3DION Spatial Workspace Assistant. I can help you with 3D product management, catalog creation, AR publishing, billing, and lead analytics.";
  let actionBtn = null;

  // 1. Permission Check for Billing Queries
  if (prompt.includes('billing') || prompt.includes('subscription') || prompt.includes('plan') || prompt.includes('payment') || prompt.includes('invoice')) {
    if (user.role === 'Sales User' || user.role === 'Viewer') {
      reply = "You don't have permission to access organization billing and subscription settings. Please contact your Organization Admin or Owner.";
    } else {
      reply = "You can view and manage your organization's subscription plan, custom entitlements, and invoice history in the Billing & Subscriptions settings.";
      actionBtn = { text: 'Manage Billing', path: '/settings/billing' };
    }
  } 
  // 2. Publishing Queries
  else if (prompt.includes('publish') || prompt.includes('draft') || prompt.includes('visibility') || prompt.includes('internal')) {
    reply = "Products and Catalogs support three visibility modes: Public (anyone with link), Organization Only (members of your company), and Restricted (Enterprise explicit teams/users). You can set visibility when editing a product.";
    actionBtn = { text: 'View Products', path: '/products' };
  } 
  // 3. Lead & Analytics Queries
  else if (prompt.includes('lead') || prompt.includes('qr') || prompt.includes('ar') || prompt.includes('scan') || prompt.includes('analytics')) {
    reply = "Your spatial analytics track product 3D views, AR launch sessions, QR code scans, and intent-scored leads in real-time.";
    actionBtn = { text: 'View Leads', path: '/leads' };
  }
  // 4. Team & Invite Queries
  else if (prompt.includes('invite') || prompt.includes('member') || prompt.includes('role') || prompt.includes('team')) {
    if (user.role === 'Viewer' || user.role === 'Sales User') {
      reply = "Inviting team members and managing roles requires Admin or Manager permissions.";
    } else {
      reply = "You can invite new team members via email and assign roles (Admin, Manager, Sales User, Viewer) in Team Management.";
      actionBtn = { text: 'Invite Team', path: '/settings/team' };
    }
  }

  res.json({
    reply,
    userRole: user.role,
    organizationId: user.organization_id,
    actionBtn,
  });
}));
