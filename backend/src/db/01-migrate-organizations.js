import { pool } from './pool.js';

async function run() {
  console.log('Starting organization migration...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if organizations table exists
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations'
      );
    `);
    
    if (res.rows[0].exists) {
      console.log('Renaming organizations to organizations...');
      await client.query('ALTER TABLE organizations RENAME TO organizations;');
      
      console.log('Renaming organization_preferences to organization_preferences...');
      await client.query('ALTER TABLE organization_preferences RENAME TO organization_preferences;');
      await client.query('ALTER TABLE organization_preferences RENAME COLUMN organization_id TO organization_id;');
      
      const tablesWithCompanyId = [
        'users',
        'products',
        'files',
        'product_assets',
        'catalogs',
        'qr_codes',
        'leads',
        'analytics_events',
        'product_animations',
        'product_hotspots',
        'lead_activities',
        'audit_logs',
        'support_tickets',
        'notifications',
        'integrations',
        'security_alerts'
      ];
      
      for (const table of tablesWithCompanyId) {
        console.log(`Renaming organization_id to organization_id in table: ${table}...`);
        await client.query(`ALTER TABLE ${table} RENAME COLUMN organization_id TO organization_id;`);
      }
      
      // Create organization_members table
      console.log('Creating organization_members table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS organization_members (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role user_role NOT NULL DEFAULT 'Viewer',
          joined_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(organization_id, user_id)
        );
      `);

      console.log('Creating organization_domains table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS organization_domains (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          domain text NOT NULL,
          verification_status text NOT NULL DEFAULT 'Pending',
          verification_token text,
          verified_at timestamptz,
          auto_join_enabled boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(domain)
        );
      `);

      // Migrate existing users to organization_members
      console.log('Migrating existing users to organization_members...');
      await client.query(`
        INSERT INTO organization_members (organization_id, user_id, role)
        SELECT organization_id, id, role
        FROM users
        WHERE organization_id IS NOT NULL
        ON CONFLICT DO NOTHING;
      `);

    } else {
      console.log('Companies table does not exist. Skipping rename.');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
