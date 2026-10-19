import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');

const initialTestMode = process.env.TEST_MODE;

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv, override: true });
}

if (initialTestMode) {
  process.env.TEST_MODE = initialTestMode;
}

// Vercel deployment URL logic
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const isProd = process.env.NODE_ENV === 'production';

// Safe runtime JWT secret resolution that prevents unhandled boot crashes on Vercel
const resolveJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'test') return 'test_jwt_secret_only';
  if (process.env.VERCEL || isProd) {
    console.warn('[Security Warning] JWT_SECRET is not set in environment variables. Using runtime instance secret.');
    return process.env.VERCEL_GIT_COMMIT_SHA || 'i3dion_spatial_vercel_runtime_jwt_secret_849204';
  }
  return 'i3dion_spatial_local_dev_jwt_secret_12345';
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  // Trust VERCEL_URL, otherwise fallback to local APP_URL
  appUrl: vercelUrl ?? process.env.APP_URL ?? 'http://localhost:5173',
  apiUrl: process.env.API_URL ?? (isProd ? vercelUrl : 'http://localhost:4000'),
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@localhost:5432/i3dion_spatial',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '10m',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 150 * 1024 * 1024),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY,
  supabaseBucket: process.env.SUPABASE_BUCKET ?? 'uploads',
  billing: {
    productLaunchDate: new Date('2026-09-10T00:00:00Z'),
    launchWindowEndDate: new Date('2026-12-18T23:59:59Z'), 
    standardTrialDays: 14,
  },
};
