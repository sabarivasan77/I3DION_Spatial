import { pool, query, ensureMigrated } from '../src/db/pool.js';

async function main() {
  await ensureMigrated();
  const res = await query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name IN ('organization_id', 'tenant_id') 
    ORDER BY table_name;
  `);
  console.log('Found tables with tenant column:', res.rows.length);
  for (const r of res.rows) {
    console.log(`- ${r.table_name} (${r.column_name})`);
  }
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
