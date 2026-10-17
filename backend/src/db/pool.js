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

/**
 * Execute a callback within an isolated PostgreSQL transaction on a dedicated client.
 * Automatically handles BEGIN, COMMIT, ROLLBACK, and releases the client. (Annex A6)
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute a callback within a tenant-scoped PostgreSQL transaction with transaction-local app.org_id. (Annex A6)
 */
export async function withTenant(orgId, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (orgId) {
      await client.query("SELECT set_config('app.org_id', $1, true)", [orgId]);
    }
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
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

      CREATE TABLE IF NOT EXISTS product_assets_map (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        asset_id uuid NOT NULL REFERENCES vault_assets(id) ON DELETE CASCADE,
        asset_role text NOT NULL DEFAULT 'GALLERY_IMAGE',
        display_order integer NOT NULL DEFAULT 0,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (product_id, asset_id, asset_role)
      );

      CREATE TABLE IF NOT EXISTS product_relationships (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        source_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        target_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        relationship_type text NOT NULL DEFAULT 'compatible',
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_product_id, target_product_id, relationship_type)
      );

      CREATE TABLE IF NOT EXISTS vault_schemas (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        version text NOT NULL DEFAULT '1.0',
        is_active boolean NOT NULL DEFAULT true,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS vault_schema_fields (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        schema_id uuid NOT NULL REFERENCES vault_schemas(id) ON DELETE CASCADE,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name text NOT NULL,
        internal_name text NOT NULL,
        field_type text NOT NULL DEFAULT 'text',
        description text,
        required boolean NOT NULL DEFAULT false,
        unique_constraint boolean NOT NULL DEFAULT false,
        default_value text,
        validation_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
        display_order integer NOT NULL DEFAULT 0,
        visibility text NOT NULL DEFAULT 'INTERNAL',
        editable boolean NOT NULL DEFAULT true,
        system_field boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (schema_id, internal_name)
      );

      CREATE TABLE IF NOT EXISTS studio_projects (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
        name text NOT NULL,
        description text,
        project_type text NOT NULL DEFAULT 'Application',
        status text NOT NULL DEFAULT 'Draft',
        thumbnail text,
        version integer NOT NULL DEFAULT 1,
        last_published_version integer,
        visibility text NOT NULL DEFAULT 'Organization',
        product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        vault_asset_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        project_document jsonb NOT NULL DEFAULT '{"screens": [], "components": [], "component_tree": [], "variables": [], "data_sources": [], "bindings": [], "actions": [], "logic": [], "theme": {}, "settings": {}}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        published_at timestamptz
      );

      CREATE TABLE IF NOT EXISTS studio_project_versions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id uuid NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        version_number integer NOT NULL,
        author_id uuid REFERENCES users(id) ON DELETE SET NULL,
        change_summary text,
        project_document jsonb NOT NULL,
        published_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    
    // Non-blocking schema enhancements & Spatial Hub Seeding
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'PUBLIC';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'PUBLISHED';
      ALTER TABLE vault_assets ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'Approved';
      ALTER TABLE vault_assets ADD COLUMN IF NOT EXISTS major_version integer DEFAULT 1;
      ALTER TABLE vault_assets ADD COLUMN IF NOT EXISTS minor_version integer DEFAULT 0;
      ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'In Review';
      ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS layout_config jsonb NOT NULL DEFAULT '{"sections": []}'::jsonb;
      ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS branding jsonb NOT NULL DEFAULT '{}'::jsonb;
      ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS published_snapshot jsonb;
      ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS pdf_url text;
      ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS pinned_version_number integer NOT NULL DEFAULT 1;
      ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS pinned_asset_id uuid REFERENCES vault_assets(id) ON DELETE SET NULL;
      ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS custom_spec_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

      CREATE TABLE IF NOT EXISTS spatial_experiences (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text,
        status text NOT NULL DEFAULT 'Draft',
        vault_asset_id uuid REFERENCES vault_assets(id) ON DELETE SET NULL,
        pinned_version_number integer NOT NULL DEFAULT 1,
        scene_config jsonb NOT NULL DEFAULT '{"camera": {"fov": 45, "position": [0, 1.5, 3], "target": [0, 0, 0]}, "environment": {"preset": "studio", "exposure": 1.0, "contactShadow": true, "reflection": 0.2}, "ground": {"showGrid": true, "shadowOpacity": 0.4}}'::jsonb,
        hotspots jsonb NOT NULL DEFAULT '[]'::jsonb,
        animation_config jsonb NOT NULL DEFAULT '{"activeClip": null, "playbackSpeed": 1.0, "explodedViewFactor": 0.0, "parts": []}'::jsonb,
        blueprint_config jsonb NOT NULL DEFAULT '{"enabled": false, "dimensions": {"length": 0, "width": 0, "height": 0, "unit": "mm"}, "callouts": []}'::jsonb,
        ar_config jsonb NOT NULL DEFAULT '{"scale": 1.0, "placement": "floor", "allowSnapshot": true, "ctaText": "Request Quote"}'::jsonb,
        published_snapshot jsonb,
        published_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug text;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_spam boolean NOT NULL DEFAULT false;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS qr_attributed boolean NOT NULL DEFAULT false;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS experience_id uuid REFERENCES spatial_experiences(id) ON DELETE SET NULL;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS dedupe_key text;
      
      -- Expand analytics_events event_type constraint to include standard taxonomy
      ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
      ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
        CHECK (event_type IN (
          'page_view', 'product_view', 'catalog_view', 'catalog_generated', 'catalog_downloaded',
          'product_visit_from_catalog', 'qr_scan_from_catalog', 'qr_scan', 'qr_landing', 'qr_preview', 'qr_download',
          '3d_interaction', 'hotspot_click', 'hotspot_view', 'animation_play', 'blueprint_toggle',
          'ar_launch', 'ar_session', 'ar_launch_attempt', 'ar_session_success', 'ar_unsupported_fallback',
          'cta_quote_click', 'lead_form_submitted', 'dwell_time_ping', 'session_duration', 'lead_created',
          'user_register', 'user_login', 'brochure_download', 'quote_request', 'time_spent', 'button_click', 'model_rotation', 'search', 'exit_intent', 'contact_sales', 'model_download'
        ));

      CREATE INDEX IF NOT EXISTS idx_analytics_dedupe ON analytics_events(dedupe_key);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_org_created ON analytics_events(organization_id, created_at);

      -- Commercial & Billing Tables
      CREATE TABLE IF NOT EXISTS usage_counters (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        products_count integer NOT NULL DEFAULT 0,
        catalogs_count integer NOT NULL DEFAULT 0,
        models_count integer NOT NULL DEFAULT 0,
        storage_bytes_used bigint NOT NULL DEFAULT 0,
        team_members_count integer NOT NULL DEFAULT 1,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

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

      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        razorpay_payment_id text UNIQUE,
        razorpay_order_id text,
        amount_inr numeric(10, 2) NOT NULL DEFAULT 0,
        currency text NOT NULL DEFAULT 'INR',
        status text NOT NULL DEFAULT 'captured',
        method text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id text PRIMARY KEY,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        plan_id text NOT NULL,
        billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
        amount_paise integer NOT NULL,
        amount_inr numeric(10, 2) NOT NULL,
        currency text NOT NULL DEFAULT 'INR',
        status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        invoice_number text NOT NULL UNIQUE,
        plan_id text NOT NULL,
        amount_inr numeric(10, 2) NOT NULL DEFAULT 0,
        tax_inr numeric(10, 2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'paid',
        period_start timestamptz NOT NULL DEFAULT now(),
        period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
        pdf_url text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

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
        country text NOT NULL DEFAULT 'India',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS enterprise_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_price_inr integer;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_max_products integer;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_max_catalogs integer;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_max_3d_models integer;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_max_storage_bytes bigint;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_max_team_members integer;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_features jsonb;
    `).catch((e) => {
      console.warn('Non-blocking DDL notice in pool.js:', e.message);
    });

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
