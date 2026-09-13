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
  role user_role NOT NULL DEFAULT 'Admin',
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
  status lead_status NOT NULL DEFAULT 'New',
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

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id text;

ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('page_view', 'product_view', 'catalog_view', 'catalog_generated', 'catalog_downloaded', 'product_visit_from_catalog', 'qr_scan_from_catalog', 'qr_scan', 'qr_preview', 'qr_download', 'ar_launch', 'ar_session', 'session_duration', 'lead_created', 'hotspot_view', 'animation_play', 'user_register', 'user_login', 'brochure_download', 'quote_request', 'time_spent', 'button_click', 'model_rotation'));

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


