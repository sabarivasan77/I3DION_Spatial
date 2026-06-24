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
import { errorHandler, notFound } from './utils/errors.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: config.appUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));

// Serve uploaded files
app.use(`/${config.uploadDir}`, express.static(path.resolve(process.cwd(), config.uploadDir)));

app.get('/api/health', async (_req, res) => {
  let dbConnected = false;
  let storageAvailable = false;
  
  try {
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch (err) {}
  
  try {
    await fs.access(path.resolve(process.cwd(), config.uploadDir));
    storageAvailable = true;
  } catch (err) {}
  
  res.status(dbConnected && storageAvailable ? 200 : 503).json({
    ok: dbConnected && storageAvailable,
    service: 'i3dion-spatial-api',
    dbConnected,
    storageAvailable
  });
});

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api', resourcesRouter);
app.use(notFound);
app.use(errorHandler);

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
