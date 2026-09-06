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
import { searchRouter } from './routes/search.js';
import { aiRouter } from './routes/ai.js';
import { supportRouter } from './routes/support.js';
import { deviceRouter } from './routes/device.js';
import { securityRouter } from './routes/security.js';
import { errorHandler, notFound } from './utils/errors.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : [];

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn("WARNING: CORS_ALLOWED_ORIGINS environment variable should be set in production.");
}
if (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173', config.appUrl);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch (err) {}
  
  try {
    if (!process.env.VERCEL) {
      await fs.access(path.resolve(process.cwd(), config.uploadDir));
      storageAvailable = true;
    } else {
      storageAvailable = true; // Assume Vercel Blob is available
    }
  } catch (err) {}
  
  res.status(dbConnected && storageAvailable ? 200 : 503).json({
    ok: dbConnected && storageAvailable,
    service: 'i3dion-spatial-api',
    dbConnected,
    storageAvailable,
    debug: {
      supabaseUrl: config.supabaseUrl,
      supabaseKeyLength: config.supabaseKey?.length,
      vercelUrl: config.appUrl,
      dbUrl: config.databaseUrl?.substring(0, 30) + '...'
    }
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/public', publicRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/leads', leadsRouter);
apiRouter.use('/hub', hubRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/device', deviceRouter);
apiRouter.use('/security', securityRouter);
apiRouter.use('/', resourcesRouter);

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

if (!process.env.VERCEL) {
  // Local environment startup
  try {
    console.log('\nI3DION Spatial API starting...');
    app.listen(config.port, () => {
      console.log(`I3DION Spatial API running on http://localhost:${config.port}`);
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
