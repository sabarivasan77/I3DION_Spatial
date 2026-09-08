import { pool } from './pool.js';

async function migrateEnterpriseBilling() {
  console.log('Starting Enterprise Billing & Plan Corrections Migration...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update Plans Seed to strict pricing structure
    // Rule: Public plans cannot exceed ₹3,000/mo. Enterprise is Custom (0).
    await client.query(`
      INSERT INTO plans (id, name, description, price_monthly_inr, price_yearly_inr, max_products, max_catalogs, max_3d_models, max_storage_bytes, max_team_members, features)
      VALUES 
        ('FREE', 'Free', 'Ideal for exploring spatial catalog features', 0, 0, 3, 3, 3, 52428800, 1, '{"ar_views": true, "qr_codes": true, "basic_lead_capture": true, "advanced_analytics": false, "custom_branding": false, "custom_domain": false}'::jsonb),
        ('STARTER', 'Starter', 'Essential tools for small industrial teams', 999, 9990, 25, 10, 25, 1073741824, 3, '{"ar_views": true, "qr_codes": true, "basic_lead_management": true, "basic_analytics": true, "custom_branding": false, "custom_domain": false}'::jsonb),
        ('BUSINESS', 'Business', 'Complete suite for growing industrial companies', 1999, 19990, 100, 50, 100, 10737418240, 10, '{"ar_views": true, "qr_codes": true, "lead_management": true, "advanced_analytics": true, "custom_branding": true, "custom_domain": false}'::jsonb),
        ('PRO', 'Pro', 'High performance for scale-stage industrial organizations', 2999, 29990, 250, 150, 250, 53687091200, 25, '{"ar_views": true, "qr_codes": true, "lead_management": true, "advanced_analytics": true, "custom_branding": true, "custom_domain": true, "priority_support": true}'::jsonb),
        ('ENTERPRISE', 'Enterprise', 'Custom solutions for large industrial organizations with customized limits and dedicated support', 0, 0, 999999, 999999, 999999, 536870912000, 999, '{"ar_views": true, "qr_codes": true, "lead_management": true, "advanced_analytics": true, "custom_branding": true, "custom_domain": true, "priority_support": true, "custom_integrations": true, "dedicated_account_manager": true}'::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_monthly_inr = EXCLUDED.price_monthly_inr,
        price_yearly_inr = EXCLUDED.price_yearly_inr,
        max_products = EXCLUDED.max_products,
        max_catalogs = EXCLUDED.max_catalogs,
        max_3d_models = EXCLUDED.max_3d_models,
        max_storage_bytes = EXCLUDED.max_storage_bytes,
        max_team_members = EXCLUDED.max_team_members,
        features = EXCLUDED.features,
        updated_at = now();
    `);

    // 2. Migrate existing subscriptions pointing to 'UNLIMITED' to 'ENTERPRISE'
    await client.query(`
      UPDATE subscriptions SET plan_id = 'ENTERPRISE' WHERE plan_id = 'UNLIMITED';
      DELETE FROM plans WHERE id = 'UNLIMITED';
    `);

    // 3. Extend Subscriptions Table for Custom Entitlements
    await client.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS custom_price_inr numeric(10,2),
      ADD COLUMN IF NOT EXISTS custom_max_products integer,
      ADD COLUMN IF NOT EXISTS custom_max_catalogs integer,
      ADD COLUMN IF NOT EXISTS custom_max_3d_models integer,
      ADD COLUMN IF NOT EXISTS custom_max_team_members integer,
      ADD COLUMN IF NOT EXISTS custom_max_storage_bytes bigint,
      ADD COLUMN IF NOT EXISTS custom_features jsonb,
      ADD COLUMN IF NOT EXISTS enterprise_offer_id uuid;
    `);

    // 4. Create Enterprise Requests Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enterprise_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        company_name text NOT NULL,
        work_email text NOT NULL,
        contact_name text NOT NULL,
        phone text,
        expected_product_count integer DEFAULT 100,
        expected_catalog_usage integer DEFAULT 50,
        team_size integer DEFAULT 10,
        required_features jsonb DEFAULT '[]'::jsonb,
        message text,
        status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'offer_prepared', 'awaiting_customer', 'approved', 'active', 'rejected')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 5. Create Enterprise Offers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enterprise_offers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        request_id uuid REFERENCES enterprise_requests(id) ON DELETE SET NULL,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'active', 'rejected', 'expired')),
        custom_price_inr numeric(10,2) NOT NULL DEFAULT 0,
        currency text NOT NULL DEFAULT 'INR',
        billing_interval text NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
        valid_from timestamptz NOT NULL DEFAULT now(),
        valid_until timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
        product_limit integer NOT NULL DEFAULT 500,
        model_limit integer NOT NULL DEFAULT 500,
        catalog_limit integer NOT NULL DEFAULT 100,
        team_limit integer NOT NULL DEFAULT 50,
        storage_limit_bytes bigint NOT NULL DEFAULT 536870912000, -- 500GB
        feature_entitlements jsonb NOT NULL DEFAULT '{}'::jsonb,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 6. Create Organization Billing Information Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_billing_info (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        billing_name text NOT NULL,
        billing_email text NOT NULL,
        phone text,
        tax_id text,
        address_line1 text,
        address_line2 text,
        city text,
        state text,
        postal_code text,
        country text DEFAULT 'India',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Enterprise Billing Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Enterprise Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

migrateEnterpriseBilling().catch(() => process.exit(1));
