import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ...( (config.nodeEnv === 'production' || config.databaseUrl?.includes('sslmode=') || config.databaseUrl?.includes('supabase') || config.databaseUrl?.includes('neon') || config.databaseUrl?.includes('render')) && {
    ssl: { rejectUnauthorized: false }
  })
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

let migrationRun = false;

export async function ensureMigrated() {
  if (migrationRun) return;
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    
    // V2 Tables & Columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        email text NOT NULL,
        purpose text NOT NULL,
        otp_hash text NOT NULL,
        attempts_count integer NOT NULL DEFAULT 0,
        max_attempts integer NOT NULL DEFAULT 5,
        expires_at timestamptz NOT NULL,
        verified_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS organization_invitations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email text NOT NULL,
        role user_role NOT NULL DEFAULT 'Sales User',
        token text NOT NULL UNIQUE,
        invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'pending',
        expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
        accepted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, email)
      );

      CREATE TABLE IF NOT EXISTS publishing_access (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        product_id uuid REFERENCES products(id) ON DELETE CASCADE,
        catalog_id uuid REFERENCES catalogs(id) ON DELETE CASCADE,
        visibility text NOT NULL DEFAULT 'PUBLIC',
        approval_status text NOT NULL DEFAULT 'PUBLISHED',
        published_by uuid REFERENCES users(id) ON DELETE SET NULL,
        published_at timestamptz NOT NULL DEFAULT now(),
        restricted_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        restricted_team_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        expires_at timestamptz,
        passcode_hash text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        email_notifications boolean NOT NULL DEFAULT true,
        in_app_notifications boolean NOT NULL DEFAULT true,
        weekly_digest boolean NOT NULL DEFAULT true,
        lead_alerts boolean NOT NULL DEFAULT true,
        security_alerts boolean NOT NULL DEFAULT true,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS weekly_reports (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        report_period_start timestamptz NOT NULL,
        report_period_end timestamptz NOT NULL,
        metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
        pdf_report_url text,
        sent_to_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS automation_rules (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        rule_name text NOT NULL,
        trigger_event text NOT NULL,
        conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
        action_type text NOT NULL,
        action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS plans (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text,
        price_monthly_inr integer NOT NULL DEFAULT 0,
        price_yearly_inr integer NOT NULL DEFAULT 0,
        max_products integer NOT NULL DEFAULT 3,
        max_catalogs integer NOT NULL DEFAULT 2,
        max_3d_models integer NOT NULL DEFAULT 3,
        max_storage_bytes bigint NOT NULL DEFAULT 52428800,
        max_team_members integer NOT NULL DEFAULT 1,
        features jsonb NOT NULL DEFAULT '{}'::jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      INSERT INTO plans (id, name, description, price_monthly_inr, price_yearly_inr, max_products, max_catalogs, max_3d_models, max_storage_bytes, max_team_members, features)
      VALUES 
        ('FREE', 'Free Tier', 'Ideal for exploring spatial catalog features', 0, 0, 3, 2, 3, 52428800, 1, '{"ar_views": true, "qr_codes": true}'::jsonb),
        ('STARTER', 'Starter Plan', 'Essential tools for growing spatial catalogs', 1499, 14990, 25, 10, 25, 1073741824, 3, '{"ar_views": true, "qr_codes": true, "advanced_analytics": true}'::jsonb),
        ('BUSINESS', 'Business Pro', 'Complete suite for active sales & marketing teams', 4999, 49990, 100, 50, 100, 10737418240, 10, '{"ar_views": true, "qr_codes": true, "advanced_analytics": true, "custom_branding": true}'::jsonb),
        ('UNLIMITED', 'Enterprise Unlimited', 'Unrestricted catalog scale and priority support', 14999, 149990, 999999, 999999, 999999, 107374182400, 50, '{"ar_views": true, "qr_codes": true, "advanced_analytics": true, "custom_branding": true, "priority_support": true}'::jsonb)
      ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS subscriptions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id text NOT NULL REFERENCES plans(id),
        billing_cycle text NOT NULL DEFAULT 'monthly',
        status text NOT NULL DEFAULT 'active',
        razorpay_subscription_id text UNIQUE,
        razorpay_customer_id text,
        current_period_start timestamptz NOT NULL DEFAULT now(),
        current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
        cancel_at_period_end boolean NOT NULL DEFAULT false,
        cancelled_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ml_models (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        version text NOT NULL DEFAULT 'v1.0',
        status text NOT NULL DEFAULT 'Active',
        metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      INSERT INTO ml_models (name, version, status, metrics)
      VALUES 
        ('Lead Propensity Scorer', 'v2.1', 'Active', '{"accuracy": 0.92, "f1_score": 0.89}'::jsonb),
        ('Spatial Recommender Engine', 'v1.4', 'Active', '{"precision": 0.88, "recall": 0.85}'::jsonb)
      ON CONFLICT DO NOTHING;

      CREATE TABLE IF NOT EXISTS vault_saved_views (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        collection_id text NOT NULL,
        name text NOT NULL,
        is_shared boolean NOT NULL DEFAULT false,
        columns_config jsonb NOT NULL DEFAULT '[]'::jsonb,
        filters_config jsonb NOT NULL DEFAULT '[]'::jsonb,
        sort_config jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS vault_shares (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        resource_type text NOT NULL CHECK (resource_type IN ('asset', 'collection', 'dataset')),
        resource_id uuid NOT NULL,
        shared_with_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit', 'admin')),
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS vault_approval_workflows (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        resource_type text NOT NULL CHECK (resource_type IN ('asset', 'record')),
        resource_id uuid NOT NULL,
        version_id uuid,
        approval_status text NOT NULL DEFAULT 'Draft' CHECK (approval_status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected')),
        requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
        review_notes text,
        submitted_at timestamptz NOT NULL DEFAULT now(),
        reviewed_at timestamptz
      );

      CREATE TABLE IF NOT EXISTS vault_enquiries (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        source_application text NOT NULL DEFAULT 'Spatial Hub',
        product_id uuid REFERENCES products(id) ON DELETE SET NULL,
        catalog_id uuid REFERENCES catalogs(id) ON DELETE SET NULL,
        customer_name text NOT NULL,
        company text,
        email text NOT NULL,
        phone text,
        message text,
        status text NOT NULL DEFAULT 'New',
        priority text NOT NULL DEFAULT 'Medium',
        assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS catalog_products_ordering (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        catalog_id uuid NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        display_order integer NOT NULL DEFAULT 0,
        UNIQUE (catalog_id, product_id)
      );
    `);

    
    // Non-blocking schema enhancements & Spatial Hub Seeding
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'PUBLIC';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'PUBLISHED';
      ALTER TABLE vault_assets ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'Approved';
      ALTER TABLE vault_assets ADD COLUMN IF NOT EXISTS major_version integer DEFAULT 1;
      ALTER TABLE vault_assets ADD COLUMN IF NOT EXISTS minor_version integer DEFAULT 0;
    `).catch(() => {});

    try {
      const { patchIntelligenceSchema } = await import('./patch-intelligence-schema.js');
      await patchIntelligenceSchema();
    } catch (intelErr) {
      console.warn('Non-blocking Intelligence schema patch note:', intelErr.message);
    }

    try {
      const { seedSpatialHubDatabase } = await import('./seed-spatial-hub.js');
      await seedSpatialHubDatabase();
    } catch (seedErr) {
      console.warn('Non-blocking Spatial Hub seeding note:', seedErr.message);
    }

    migrationRun = true;
  } catch (err) {
    console.error('Database migration check failed:', err.message);
  }
}

export async function migrate() {
  await ensureMigrated();
}
