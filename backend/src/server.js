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
app.use(cors({
  origin: [config.appUrl, 'http://localhost:5173', 'http://localhost:4173'],
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
    storageAvailable
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
if (process.env.VERCEL) {
  app.use('/', apiRouter);
}
app.use(notFound);
app.use(errorHandler);

if (process.env.VERCEL) {
  // In Vercel, we export the app for serverless execution.
  // We can try to run migrations, but usually they are done separately in CI/CD.
  migrate().then(() => console.log('DB migration completed in Vercel')).catch(err => console.error('Migration failed in Vercel', err));
} else {
  // Local environment
  try {
    try {
      await migrate();
      console.log('Database migration completed.');
    } catch (error) {
      console.error('\nI3DION Spatial API started in degraded mode.');
      console.error('Database migration or connection failed, but the HTTP server will still listen.');
      console.error('\nExpected database URL:');
      console.error(`  ${config.databaseUrl}\n`);
      console.error(error);
    }

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
