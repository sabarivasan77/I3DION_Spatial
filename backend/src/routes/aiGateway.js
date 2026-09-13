import { Router } from 'express';
import { aiGatewayService } from '../services/aiGatewayService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/ai/gateway/status
 * Check Vercel AI Gateway readiness
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    gateway: 'Vercel AI Gateway',
    tokenConfigured: true,
    supportedModels: ['openai/gpt-4o', 'google/gemini-2.5-flash', 'anthropic/claude-3-5-sonnet']
  });
});

/**
 * POST /api/ai/gateway/completion
 * Generate text/logic completion via Vercel AI Gateway
 */
router.post('/completion', authenticate, async (req, res, next) => {
  try {
    const { prompt, systemPrompt, model, temperature } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiGatewayService.generateCompletion({ prompt, systemPrompt, model, temperature });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/gateway/coding-agent
 * Execute coding agent task for 3D Spatial Logic Generation
 */
router.post('/coding-agent', authenticate, async (req, res, next) => {
  try {
    const { taskName, context, codeType } = req.body;
    if (!taskName) {
      return res.status(400).json({ error: 'taskName is required' });
    }

    const result = await aiGatewayService.runCodingAgentTask({ taskName, context, codeType });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
