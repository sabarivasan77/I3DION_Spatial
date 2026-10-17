import pg from 'pg';
const { Pool } = pg;

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-north-1',
  'sa-east-1'
];

async function check() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const connectionString = `postgres://postgres.rbgrkrmgikzkbbtzomeu:I3dionSpatial2026!@${host}:6543/postgres`;
    const p = new Pool({
      connectionString,
      connectionTimeoutMillis: 3500,
      ssl: { rejectUnauthorized: false }
    });
    try {
      const res = await p.query('SELECT 1 as connected');
      console.log(`🎉 SUCCESS! Region found: ${r} on host ${host}`);
      await p.end();
      return { region: r, host, connectionString };
    } catch (e) {
      console.log(`Region ${r}: ${e.message}`);
      await p.end();
    }
  }
}

check().catch(console.error);
