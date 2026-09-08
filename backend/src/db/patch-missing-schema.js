import { query } from './pool.js';

async function patchSchema() {
  console.log('Patching schema for lead_intelligence and leads table columns...');

  // 1. Add missing columns to leads table
  await query(`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Medium';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
  `);

  // 2. Create lead_intelligence table
  await query(`
    CREATE TABLE IF NOT EXISTS lead_intelligence (
      lead_id uuid PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
      behavior_score integer NOT NULL DEFAULT 0,
      total_time_spent integer NOT NULL DEFAULT 0,
      total_pages_visited integer NOT NULL DEFAULT 0,
      total_products_viewed integer NOT NULL DEFAULT 0,
      total_qr_scans integer NOT NULL DEFAULT 0,
      total_ar_sessions integer NOT NULL DEFAULT 0,
      total_downloads integer NOT NULL DEFAULT 0,
      lead_category text NOT NULL DEFAULT 'Cold',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // 3. Backfill missing lead_intelligence records for existing leads
  await query(`
    INSERT INTO lead_intelligence (lead_id, behavior_score, lead_category)
    SELECT id, COALESCE(score, 0), 'Cold'
    FROM leads
    ON CONFLICT (lead_id) DO NOTHING;
  `);

  console.log('✅ Schema patched successfully!');
  process.exit(0);
}

patchSchema().catch((err) => {
  console.error('Error patching schema:', err);
  process.exit(1);
});
