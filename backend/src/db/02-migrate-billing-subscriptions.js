import { pool } from './pool.js';

async function migrateBillingAndSubscriptions() {
  console.log('Starting Multi-Tenant Billing & Subscriptions DB Migration...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Plans Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id text PRIMARY KEY, -- e.g. 'FREE', 'STARTER', 'BUSINESS', 'UNLIMITED'
        name text NOT NULL,
        description text,
        price_monthly_inr integer NOT NULL DEFAULT 0,
        price_yearly_inr integer NOT NULL DEFAULT 0,
        razorpay_plan_id_monthly text,
        razorpay_plan_id_yearly text,
        max_products integer NOT NULL DEFAULT 3,
        max_catalogs integer NOT NULL DEFAULT 2,
        max_3d_models integer NOT NULL DEFAULT 3,
        max_storage_bytes bigint NOT NULL DEFAULT 52428800, -- 50MB
        max_team_members integer NOT NULL DEFAULT 1,
        features jsonb NOT NULL DEFAULT '{}'::jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 2. Insert Default SaaS Plans
    await client.query(`
      INSERT INTO plans (id, name, description, price_monthly_inr, price_yearly_inr, max_products, max_catalogs, max_3d_models, max_storage_bytes, max_team_members, features)
      VALUES 
        ('FREE', 'Free Tier', 'Ideal for exploring spatial catalog features', 0, 0, 3, 2, 3, 52428800, 1, '{"ar_views": true, "qr_codes": true, "advanced_analytics": false, "custom_branding": false, "custom_domain": false}'::jsonb),
        ('STARTER', 'Starter Plan', 'Essential tools for growing spatial catalogs', 1499, 14990, 25, 10, 25, 1073741824, 3, '{"ar_views": true, "qr_codes": true, "advanced_analytics": true, "custom_branding": false, "custom_domain": false}'::jsonb),
        ('BUSINESS', 'Business Pro', 'Complete suite for active sales & marketing teams', 4999, 49990, 100, 50, 100, 10737418240, 10, '{"ar_views": true, "qr_codes": true, "advanced_analytics": true, "custom_branding": true, "custom_domain": true}'::jsonb),
        ('UNLIMITED', 'Enterprise Unlimited', 'Unrestricted catalog scale and priority support', 14999, 149990, 999999, 999999, 999999, 107374182400, 50, '{"ar_views": true, "qr_codes": true, "advanced_analytics": true, "custom_branding": true, "custom_domain": true, "priority_support": true}'::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
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

    // 3. Create Subscriptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id text NOT NULL REFERENCES plans(id),
        billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
        status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired', 'pending', 'payment_failed')),
        razorpay_subscription_id text UNIQUE,
        razorpay_customer_id text,
        current_period_start timestamptz NOT NULL DEFAULT now(),
        current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
        cancel_at_period_end boolean NOT NULL DEFAULT false,
        cancelled_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 4. Create Usage Counters Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_counters (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        products_count integer NOT NULL DEFAULT 0,
        catalogs_count integer NOT NULL DEFAULT 0,
        models_count integer NOT NULL DEFAULT 0,
        storage_bytes_used bigint NOT NULL DEFAULT 0,
        team_members_count integer NOT NULL DEFAULT 1,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 5. Create Billing Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_customers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
        razorpay_customer_id text NOT NULL UNIQUE,
        email text NOT NULL,
        name text NOT NULL,
        phone text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 6. Create Billing Events Table (Idempotency)
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider text NOT NULL DEFAULT 'razorpay',
        provider_event_id text NOT NULL,
        event_type text NOT NULL,
        payload jsonb NOT NULL,
        processed_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(provider, provider_event_id)
      );
    `);

    // 7. Create Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        razorpay_payment_id text UNIQUE,
        razorpay_order_id text,
        razorpay_subscription_id text,
        amount_inr numeric(10,2) NOT NULL,
        status text NOT NULL, -- e.g. 'captured', 'failed', 'refunded'
        method text,
        email text,
        contact text,
        error_code text,
        error_description text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 8. Create Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        invoice_number text UNIQUE NOT NULL,
        razorpay_invoice_id text UNIQUE,
        plan_id text NOT NULL REFERENCES plans(id),
        amount_inr numeric(10,2) NOT NULL,
        tax_inr numeric(10,2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'paid',
        period_start timestamptz NOT NULL,
        period_end timestamptz NOT NULL,
        pdf_url text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 9. Create Organization Invitations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_invitations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email text NOT NULL,
        role user_role NOT NULL DEFAULT 'Sales User',
        token text UNIQUE NOT NULL,
        invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
        expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
        accepted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, email)
      );
    `);

    // 10. Backfill existing organizations with FREE subscriptions and usage records
    await client.query(`
      INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status, current_period_start, current_period_end)
      SELECT id, 'FREE', 'monthly', 'active', now(), now() + interval '100 years'
      FROM organizations
      ON CONFLICT (organization_id) DO NOTHING;

      INSERT INTO usage_counters (organization_id, products_count, catalogs_count, models_count, storage_bytes_used, team_members_count)
      SELECT 
        o.id,
        COALESCE((SELECT COUNT(*) FROM products WHERE organization_id = o.id), 0),
        COALESCE((SELECT COUNT(*) FROM catalogs WHERE organization_id = o.id), 0),
        COALESCE((SELECT COUNT(*) FROM product_assets WHERE organization_id = o.id AND asset_type IN ('model', 'usdz_model')), 0),
        COALESCE((SELECT SUM(size_bytes) FROM product_assets WHERE organization_id = o.id), 0),
        COALESCE((SELECT COUNT(*) FROM users WHERE organization_id = o.id), 1)
      FROM organizations o
      ON CONFLICT (organization_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Billing & Subscriptions migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

migrateBillingAndSubscriptions().catch(() => process.exit(1));
