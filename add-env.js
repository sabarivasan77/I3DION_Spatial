import { spawnSync } from 'node:child_process';

function addEnv(key, value) {
  console.log(`Adding ${key}...`);
  const result = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], {
    input: value,
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  console.log(result.stdout || result.stderr);
}

// Remove them first just in case they exist to avoid duplication errors
const keys = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_BUCKET', 'USE_LOCAL_STORAGE', 'VITE_API_URL'];
for (const key of keys) {
  spawnSync('npx.cmd', ['vercel', 'env', 'rm', key, 'production', '-y'], { cwd: process.cwd(), encoding: 'utf8' });
}

addEnv('DATABASE_URL', 'postgresql://postgres:Kdsv1986%40123@db.ytjqaasskfwtrnyxttso.supabase.co:5432/postgres');
addEnv('SUPABASE_URL', 'https://ytjqaasskfwtrnyxttso.supabase.co');
addEnv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0anFhYXNza2Z3dHJueXh0dHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwNTkyNiwiZXhwIjoyMTA0MTgxOTI2fQ.KYCuDbm_wkKTzqqvHpRr7DwKR4EgLaByDRvN2dXX5PQ');
addEnv('SUPABASE_BUCKET', 'uploads');
addEnv('USE_LOCAL_STORAGE', 'false');
addEnv('VITE_API_URL', '/api');
