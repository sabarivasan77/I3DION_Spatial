CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Sales User', 'Viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('Draft', 'Published', 'Archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed', 'Lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE integration_status AS ENUM ('Active', 'Inactive', 'Error');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'publish', 'archive', 'upload', 'download');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_asset_type AS ENUM ('thumbnail', 'image', 'model', 'usdz_model', 'document', 'qr_png', 'qr_svg');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  website text,
  logo_url text,
  primary_color text DEFAULT '#2563EB',
  profile text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  avatar_url text,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'Viewer',
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  status product_status NOT NULL DEFAULT 'Draft',
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  model_url text,
  document_url text,
  video_url text,
  usdz_url text,
  is_public boolean NOT NULL DEFAULT false,
  slug text,
  public_url text,
  thumbnail_asset_id uuid,
  model_asset_id uuid,
  usdz_asset_id uuid,
  qr_code_id uuid,
  dimensions jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS public_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_asset_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_asset_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usdz_asset_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usdz_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS qr_code_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;

ALTER TYPE product_asset_type ADD VALUE IF NOT EXISTS 'document';
ALTER TYPE product_asset_type ADD VALUE IF NOT EXISTS 'usdz_model';
ALTER TYPE product_asset_type ADD VALUE IF NOT EXISTS 'qr_png';
ALTER TYPE product_asset_type ADD VALUE IF NOT EXISTS 'qr_svg';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_company_slug ON products(organization_id, slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  file_category text NOT NULL DEFAULT 'document' CHECK (file_category IN ('image', 'video', 'model', 'document')),
  original_name text NOT NULL,
  object_key text NOT NULL,
  url text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  checksum_sha256 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE files ADD COLUMN IF NOT EXISTS file_category text NOT NULL DEFAULT 'document';
ALTER TABLE files ADD COLUMN IF NOT EXISTS checksum_sha256 text;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_file_category_check;
ALTER TABLE files ADD CONSTRAINT files_file_category_check CHECK (file_category IN ('image', 'video', 'model', 'document'));

CREATE TABLE IF NOT EXISTS product_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  asset_type product_asset_type NOT NULL,
  original_name text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  checksum_sha256 text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_assets ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS catalogs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status product_status NOT NULL DEFAULT 'Draft',
  slug text NOT NULL UNIQUE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS pdf_url text;

CREATE TABLE IF NOT EXISTS catalog_products (
  catalog_id uuid NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (catalog_id, product_id)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  target_url text NOT NULL,
  png_asset_id uuid REFERENCES product_assets(id) ON DELETE SET NULL,
  svg_asset_id uuid REFERENCES product_assets(id) ON DELETE SET NULL,
  png_url text NOT NULL,
  svg_url text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS product_slug text;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS png_asset_id uuid;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS svg_asset_id uuid;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS png_url text;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS svg_url text;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS generated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_entity_type_check;
ALTER TABLE qr_codes DROP COLUMN IF EXISTS entity_type;
ALTER TABLE qr_codes DROP COLUMN IF EXISTS entity_id;

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  catalog_id uuid REFERENCES catalogs(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  organization text,
  company text,
  designation text,
  status lead_status NOT NULL DEFAULT 'New',
  priority text NOT NULL DEFAULT 'Normal',
  source text NOT NULL DEFAULT 'Catalog',
  score integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  catalog_id uuid REFERENCES catalogs(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  visitor_id text,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'product_view', 'catalog_view', 'qr_scan', 'ar_launch', 'ar_session', 'lead_created', 'hotspot_view', 'animation_play')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  session_start timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id text;

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

CREATE TABLE IF NOT EXISTS product_animations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  animation_key text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  is_enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, animation_key)
);

CREATE TABLE IF NOT EXISTS product_hotspots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  position jsonb NOT NULL,
  action_type text CHECK (action_type IS NULL OR action_type IN ('info', 'document', 'video', 'quote', 'external_link')),
  action_value text,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('note', 'email', 'call', 'meeting', 'status_change', 'task')),
  subject text,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action text NOT NULL DEFAULT 'unknown';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent text;

CREATE TABLE IF NOT EXISTS company_preferences (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  onboarding_enabled boolean NOT NULL DEFAULT true,
  default_brand_color text NOT NULL DEFAULT '#2563EB',
  default_catalog_visibility text NOT NULL DEFAULT 'private' CHECK (default_catalog_visibility IN ('private', 'public')),
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  appearance_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('FAQ', 'Contact Support', 'Report Issue', 'Feature Request', 'Documentation')),
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  notification_type text NOT NULL DEFAULT 'system',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status integration_status NOT NULL DEFAULT 'Inactive',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secrets_ref text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);

-- The user_sessions and user_devices tables have been removed to migrate to Supabase Auth.

-- 2. Upgrade Notifications for Mobile Sync
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read_mobile boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read_web boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url text; -- Deep link target

-- 3. Offline Sync Queue
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  entity_type text NOT NULL, -- 'analytics', 'lead', 'interaction'
  operation text NOT NULL, -- 'create', 'update', 'delete'
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_status ON offline_sync_queue(user_id, status);



-- ─────────────────────────────────────────────────────────────────────────────
-- ZERO TRUST SECURITY & ENTERPRISE AUTHENTICATION SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Expand User Roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Super Admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Company Admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Sales Executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Support Executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Marketing';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Analytics Viewer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Read Only';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Customer';

-- 2. Expand Users Table for Google Auth & MFA
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- 3. Session Management Table (Zero Trust tracking)
-- (Schema unified in main definitions above)
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(refresh_token_hash);

-- 4. Audit Logs (Enterprise Compliance)
-- (Schema unified in main definitions above)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 5. Security Alerts (Threat Detection)
DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  alert_type text NOT NULL, -- e.g., 'Brute Force Attempt', 'New Device Login'
  severity alert_severity NOT NULL DEFAULT 'Medium',
  is_resolved boolean NOT NULL DEFAULT false,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_security_alerts_company ON security_alerts(organization_id, is_resolved);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'Viewer',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

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

ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Medium';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

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

-- OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('account_verify', 'email_verify', 'password_reset', 'invitation', 'owner_transfer', 'security_update', 'domain_verify', 'sensitive_action')),
  otp_hash text NOT NULL,
  attempts_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications(email, purpose, verified_at);

-- Organization Invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'Sales User',
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

-- Publishing Access & Approval Workflow
CREATE TABLE IF NOT EXISTS publishing_access (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES catalogs(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'ORGANIZATION', 'RESTRICTED')),
  approval_status text NOT NULL DEFAULT 'PUBLISHED' CHECK (approval_status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED')),
  published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  restricted_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  restricted_team_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_entity CHECK ((product_id IS NOT NULL AND catalog_id IS NULL) OR (product_id IS NULL AND catalog_id IS NOT NULL))
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications jsonb NOT NULL DEFAULT '{"security": true, "leads": true, "publishing": true, "billing": true, "weekly_report": true}'::jsonb,
  in_app_notifications jsonb NOT NULL DEFAULT '{"security": true, "leads": true, "publishing": true, "billing": true, "team": true}'::jsonb,
  weekly_report_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- Weekly Reports Log
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metrics_summary jsonb NOT NULL,
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_type text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience_roles jsonb NOT NULL DEFAULT '["Admin", "Owner"]'::jsonb,
  channel text NOT NULL DEFAULT 'both' CHECK (channel IN ('email', 'in_app', 'both')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- VAULT ASSET SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('Processing', 'Ready', 'Warning', 'Failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE asset_visibility AS ENUM ('Private', 'Organization', 'Public');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS vault_collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  schema_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  type text NOT NULL,
  original_name text NOT NULL,
  storage_key text NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  checksum_sha256 text,
  status asset_status NOT NULL DEFAULT 'Processing',
  visibility asset_visibility NOT NULL DEFAULT 'Organization',
  thumbnail_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_apps jsonb NOT NULL DEFAULT '["Spatial Hub", "Omni Studio"]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  collection_id uuid REFERENCES vault_collections(id) ON DELETE SET NULL,
  template_id uuid REFERENCES vault_templates(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_asset_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid NOT NULL REFERENCES vault_assets(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  original_name text NOT NULL,
  storage_key text NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  checksum_sha256 text,
  change_description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid NOT NULL REFERENCES vault_collections(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  asset_id uuid REFERENCES vault_assets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Active',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_name text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_processing_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  asset_name text NOT NULL,
  status text NOT NULL DEFAULT 'Completed',
  progress_pct integer NOT NULL DEFAULT 100,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT now(),
  error_message text
);


-- ─────────────────────────────────────────────────────────────────────────────
-- SPATIAL HUB PERSONAL CONTENT SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMERCIAL READINESS & BILLING SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────

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

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
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

-- ============================================================================
-- Phase S1: Identity, Sessions, and Multi-Factor Authentication
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  token_hash text NOT NULL UNIQUE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  ua_hash text,
  ip_prefix text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  replaced_by uuid REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS user_mfa (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_encrypted text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  scratch_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Section: Personal Hub Tables (04-add-personal-hub-tables)
-- ============================================================================

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

-- ============================================================================
-- Section: Spatial Experiences & Studio Projects
-- ============================================================================

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

-- ============================================================================
-- Section: Flow Automation Engine (I3DION Flow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  last_published_version integer,
  trigger_type text NOT NULL DEFAULT 'manual',
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  flow_definition jsonb NOT NULL DEFAULT '{"trigger": {"id": "trig_1", "type": "manual", "label": "Manual Trigger", "config": {}}, "nodes": [], "edges": [], "variables": [], "settings": {"concurrency": 5, "timeoutSeconds": 120, "retentionDays": 30}}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS flow_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  change_summary text,
  flow_definition jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flow_id, version_number)
);

CREATE TABLE IF NOT EXISTS flow_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  flow_version integer NOT NULL DEFAULT 1,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  step_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS flow_event_outbox (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  destination_url text,
  response_status integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_flows_org_id ON flows(organization_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_flow_id ON flow_runs(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_org_id ON flow_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_flow_outbox_status ON flow_event_outbox(status);

-- ============================================================================
-- Section: Lens Intelligence Engine
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text NOT NULL UNIQUE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  visitor_id text,
  application_id text DEFAULT 'hub',
  project_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer DEFAULT 0,
  apps_opened jsonb DEFAULT '[]'::jsonb,
  products_viewed jsonb DEFAULT '[]'::jsonb,
  experiences_opened jsonb DEFAULT '[]'::jsonb,
  searches_performed jsonb DEFAULT '[]'::jsonb,
  interactions_count integer DEFAULT 0,
  cta_clicks_count integer DEFAULT 0,
  engagement_depth_score numeric DEFAULT 0.0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_behavior_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  visitor_id text,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  category_weights jsonb DEFAULT '{}'::jsonb,
  industry_weights jsonb DEFAULT '{}'::jsonb,
  product_interactions jsonb DEFAULT '{}'::jsonb,
  experience_interactions jsonb DEFAULT '{}'::jsonb,
  frequently_used_apps jsonb DEFAULT '{}'::jsonb,
  engagement_score numeric DEFAULT 0.0,
  intent_score numeric DEFAULT 0.0,
  lead_classification text DEFAULT 'COLD',
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS algorithm_configs (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  recency_decay_half_life_days integer DEFAULT 14,
  frequency_weight numeric DEFAULT 1.5,
  recency_weight numeric DEFAULT 2.0,
  depth_weight numeric DEFAULT 1.2,
  intent_weight numeric DEFAULT 3.0,
  lead_cold_threshold numeric DEFAULT 24.0,
  lead_warm_threshold numeric DEFAULT 49.0,
  lead_hot_threshold numeric DEFAULT 74.0,
  lead_high_intent_threshold numeric DEFAULT 100.0,
  custom_rules jsonb DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intelligence_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intel_events_org ON analytics_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intel_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intel_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_intel_sessions_org ON intelligence_sessions(organization_id, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_behavior_org ON user_behavior_profiles(organization_id);
