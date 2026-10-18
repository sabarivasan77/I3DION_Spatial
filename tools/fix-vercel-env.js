import { execSync } from 'node:child_process';

const envs = {
  DATABASE_URL: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  SUPABASE_URL: 'https://ytjqaasskfwtrnyxttso.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0anFhYXNza2Z3dHJueXh0dHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwNTkyNiwiZXhwIjoyMTA0MTgxOTI2fQ.KYCuDbm_wkKTzqqvHpRr7DwKR4EgLaByDRvN2dXX5PQ',
  SUPABASE_BUCKET: 'uploads',
  USE_LOCAL_STORAGE: 'false',
  VITE_API_URL: '/api'
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Setting ${key}...`);
  try {
    execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
  } catch (e) {
    // Ignore error if it doesn't exist
  }
  
  try {
    execSync(`npx vercel env add ${key} production`, { input: value, stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to add ${key}`);
  }
}

console.log('Done.');
