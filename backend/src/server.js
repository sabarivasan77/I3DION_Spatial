import fs from 'node:fs/promises';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { migrate, pool } from './db/pool.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { resourcesRouter } from './routes/resources.js';
import { analyticsRouter } from './routes/analytics.js';
import { leadsRouter } from './routes/leads.js';
import { hubRouter } from './routes/hub.js';
import { hubPersonalRouter } from './routes/hubPersonal.js';
import { searchRouter } from './routes/search.js';
import { aiRouter } from './routes/ai.js';
import { supportRouter } from './routes/support.js';
import { deviceRouter } from './routes/device.js';
import { securityRouter } from './routes/security.js';
import billingRouter from './routes/billing.js';
import webhooksRouter from './routes/webhooks.js';
import organizationRouter from './routes/organization.js';
import platformAdminRouter from './routes/platformAdmin.js';
import publishingRouter from './routes/publishing.js';
import notificationsRouter from './routes/notifications.js';
import { vaultRouter } from './routes/vault.js';
import aiGatewayRouter from './routes/aiGateway.js';
import { intelligenceRouter } from './routes/intelligence.js';
import { studioRouter } from './routes/studio.js';
import { errorHandler, notFound } from './utils/errors.js';

export const app = express();

app.set('trust proxy', 1); // Trust Vercel's proxy for express-rate-limit
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : [];

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn("WARNING: CORS_ALLOWED_ORIGINS environment variable should be set in production.");
}
if (config.appUrl && !allowedOrigins.includes(config.appUrl)) {
  allowedOrigins.push(config.appUrl);
}
if (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests or explicitly configured CORS allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin === config.appUrl) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));

// Serve uploaded files
app.use(`/${config.uploadDir}`, express.static(path.resolve(process.cwd(), config.uploadDir)));

// Serve .well-known for Android App Links / iOS Universal Links
app.use('/.well-known', express.static(path.resolve(process.cwd(), 'public/.well-known')));

const apiRouter = express.Router();

apiRouter.get('/health', async (_req, res) => {
  let dbConnected = false;
  let storageAvailable = false;
  
  try {
    const { ensureMigrated } = await import('./db/pool.js');
    await ensureMigrated();
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch (err) {
    console.error('Health check DB error:', err.message);
  }
  
  try {
    if (!process.env.VERCEL) {
      await fs.access(path.resolve(process.cwd(), config.uploadDir));
      storageAvailable = true;
    } else {
      storageAvailable = true; // Assume Vercel Blob is available
    }
  } catch (err) {}
  
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    service: 'i3dion-spatial-api',
    database: dbConnected ? 'connected' : 'disconnected',
    storage: storageAvailable ? 'connected' : 'local_fs',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/public', publicRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/leads', leadsRouter);
apiRouter.use('/hub', hubRouter);
apiRouter.use('/hub/personal', hubPersonalRouter);
apiRouter.use('/intelligence', intelligenceRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/ai/gateway', aiGatewayRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/device', deviceRouter);
apiRouter.use('/security', securityRouter);
apiRouter.use('/billing', billingRouter);
apiRouter.use('/webhooks', webhooksRouter);
apiRouter.use('/organization', organizationRouter);
apiRouter.use('/platform-admin', platformAdminRouter);
apiRouter.use('/studio', studioRouter);
apiRouter.use('/omni-studio', studioRouter);
apiRouter.use('/vault', vaultRouter);
apiRouter.use('/', resourcesRouter);

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

export function startServer(port = config.port) {
  try {
    console.log('\nI3DION Spatial API starting...');
    return app.listen(port, () => {
      console.log(`I3DION Spatial API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('\nI3DION Spatial API could not start.');
    console.error('Unexpected server startup failure.');
    console.error('\nExpected database URL:');
    console.error(`  ${config.databaseUrl}\n`);
    console.error(error);
    process.exit(1);
  }
}

if (!process.env.VERCEL && process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}
