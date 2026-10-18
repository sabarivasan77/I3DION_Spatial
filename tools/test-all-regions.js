import pg from 'pg';
const { Pool } = pg;

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'sa-east-1'
];

async function run() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const p = new Pool({
      host,
      port: 6543,
      user: 'postgres.rbgrkrmgikzkbbtzomeu',
      password: 'I3dionSpatial2026!',
      database: 'postgres',
      connectionTimeoutMillis: 8000,
      ssl: { rejectUnauthorized: false }
    });
    try {
      const res = await p.query('SELECT 1 as connected');
      console.log(`\n\n🎉🎉 FOUND IT! Region is: ${r} (host: ${host}) 🎉🎉\n\n`);
      await p.end();
      return r;
    } catch (e) {
      console.log(`[${r}] -> ${e.message}`);
      await p.end();
    }
  }
}

run().catch(console.error);
