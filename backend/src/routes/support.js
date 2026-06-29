import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { query } from '../db/pool.js';
import { supportAiEngine } from '../services/supportAiEngine.js';

export const supportRouter = Router();

// Chatbot endpoint (Public/Authenticated)
supportRouter.post('/chat', asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId || req.body.companyId; // Allow anonymous via body
  const { sessionId, message, contextData } = req.body;
  const userId = req.user?.id || null;

  if (!companyId) {
    return res.status(400).json({ message: 'Missing company ID' });
  }

  // 1. Process message through AI
  const aiResult = await supportAiEngine.processChatMessage(companyId, sessionId, message, contextData);

  // 2. Load or create session
  let currentSessionId = sessionId;
  let sessionRecord;

  if (!currentSessionId) {
    const { rows } = await query(
      `INSERT INTO chatbot_sessions (company_id, user_id, current_page, context_data, message_history)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, userId, contextData?.currentPage || '', contextData || {}, JSON.stringify([{ role: 'user', content: message }, { role: 'ai', content: aiResult.reply }])]
    );
    sessionRecord = rows[0];
    currentSessionId = sessionRecord.id;
  } else {
    // Append to existing
    const { rows } = await query(
      `UPDATE chatbot_sessions 
       SET message_history = message_history || $1::jsonb, updated_at = now() 
       WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ role: 'user', content: message }, { role: 'ai', content: aiResult.reply }]), currentSessionId]
    );
    sessionRecord = rows[0];
  }

  // 3. Auto-Escalation Ticket Creation
  if (aiResult.needsEscalation) {
    // Escalate to human
    await query(`UPDATE chatbot_sessions SET status = 'Escalated' WHERE id = $1`, [currentSessionId]);
    
    // Create Support Ticket
    await query(
      `INSERT INTO support_tickets (company_id, user_id, category, subject, message, conversation_history, sentiment, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        companyId, 
        userId, 
        aiResult.intent, 
        'Escalated Chat: ' + message.substring(0, 30), 
        message, 
        sessionRecord.message_history, 
        aiResult.sentiment, 
        aiResult.priority
      ]
    );
  }

  res.json({
    sessionId: currentSessionId,
    reply: aiResult.reply,
    needsEscalation: aiResult.needsEscalation
  });
}));

// Admin Routes (Requires Auth)

supportRouter.get('/tickets', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.*, u.name as customer_name, u.email as customer_email
     FROM support_tickets t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.company_id = $1
     ORDER BY 
       CASE priority 
         WHEN 'Critical' THEN 1 
         WHEN 'High' THEN 2 
         WHEN 'Medium' THEN 3 
         ELSE 4 
       END ASC,
       t.created_at DESC`,
    [req.user.companyId]
  );
  res.json(rows);
}));

supportRouter.get('/tickets/:id/suggestion', requireAuth, asyncHandler(async (req, res) => {
  const suggestion = await supportAiEngine.generateSmartSuggestion(req.params.id);
  res.json({ suggestion });
}));

supportRouter.get('/analytics', requireAuth, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  // Total Tickets
  const { rows: totalRows } = await query(`SELECT COUNT(*) FROM support_tickets WHERE company_id = $1`, [companyId]);
  
  // Escalated Sessions
  const { rows: escalations } = await query(`SELECT COUNT(*) FROM chatbot_sessions WHERE company_id = $1 AND status = 'Escalated'`, [companyId]);
  
  // Resolved Sessions (AI Handled)
  const { rows: resolved } = await query(`SELECT COUNT(*) FROM chatbot_sessions WHERE company_id = $1 AND status = 'Resolved'`, [companyId]);

  res.json({
    total_tickets: parseInt(totalRows[0].count),
    ai_resolved_chats: parseInt(resolved[0].count),
    escalated_chats: parseInt(escalations[0].count),
  });
}));

supportRouter.get('/kb', asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId || req.query.companyId;
  const { rows } = await query(
    `SELECT * FROM knowledge_base WHERE company_id = $1 AND is_published = true ORDER BY created_at DESC`,
    [companyId]
  );
  res.json(rows);
}));
