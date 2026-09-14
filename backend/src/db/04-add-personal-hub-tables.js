import { pool } from './pool.js';

async function migrate() {
  console.log('Starting migration: 04-add-personal-hub-tables...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id uuid NOT NULL,
        content_type text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, content_id)
      );
      
      CREATE TABLE IF NOT EXISTS liked_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id uuid NOT NULL,
        content_type text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, content_id)
      );
      
      CREATE TABLE IF NOT EXISTS hub_subscriptions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        plan text NOT NULL,
        status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Canceled', 'Past_Due', 'Trialing')),
        start_date timestamptz NOT NULL DEFAULT now(),
        renewal_date timestamptz,
        enterprise_access boolean NOT NULL DEFAULT false,
        features jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id)
      );
    `);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
