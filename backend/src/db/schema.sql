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

CREATE TABLE IF NOT EXISTS companies (
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
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_company_slug ON products(company_id, slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  catalog_id uuid REFERENCES catalogs(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  status lead_status NOT NULL DEFAULT 'New',
  source text NOT NULL DEFAULT 'Catalog',
  score integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_preferences (
  company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  notification_type text NOT NULL DEFAULT 'system',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status integration_status NOT NULL DEFAULT 'Inactive',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secrets_ref text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viewer_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  catalog_id uuid REFERENCES catalogs(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  visitor_id text,
  session_type text NOT NULL CHECK (session_type IN ('3d', 'ar')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  placement_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE viewer_sessions ADD COLUMN IF NOT EXISTS visitor_id text;

CREATE TABLE IF NOT EXISTS lead_intelligence (
  lead_id uuid PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  behavior_score integer NOT NULL DEFAULT 0,
  total_time_spent integer NOT NULL DEFAULT 0,
  total_pages_visited integer NOT NULL DEFAULT 0,
  total_products_viewed integer NOT NULL DEFAULT 0,
  total_qr_scans integer NOT NULL DEFAULT 0,
  total_ar_sessions integer NOT NULL DEFAULT 0,
  total_downloads integer NOT NULL DEFAULT 0,
  lead_category text NOT NULL DEFAULT 'Cold' CHECK (lead_category IN ('Cold', 'Warm', 'Hot', 'SQL', 'High Intent')),
  ml_features jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_status ON products(company_id, status);
CREATE INDEX IF NOT EXISTS idx_catalogs_company ON catalogs(company_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_company_status ON catalogs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_company_type ON analytics_events(company_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_company_created ON analytics_events(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_files_company_product ON files(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_assets_company_product ON product_assets(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_assets_product_type ON product_assets(product_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_company_product ON qr_codes(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_product_id ON qr_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_animations_product ON product_animations(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_hotspots_product ON product_hotspots(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON audit_logs(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_viewer_sessions_company_started ON viewer_sessions(company_id, started_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_created ON support_tickets(company_id, created_at);

-- ==========================================
-- I3DION SPATIAL HUB SCHEMA UPDATES
-- ==========================================

-- 1. Modify Products and Catalogs for Hub
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_downloadable boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS downloads_count integer NOT NULL DEFAULT 0;

ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS is_downloadable boolean NOT NULL DEFAULT false;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS downloads_count integer NOT NULL DEFAULT 0;

-- Update event_type constraint in analytics_events
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check CHECK (event_type IN ('page_view', 'product_view', 'catalog_view', 'catalog_generated', 'catalog_downloaded', 'product_visit_from_catalog', 'qr_scan_from_catalog', 'qr_scan', 'qr_preview', 'qr_download', 'ar_launch', 'ar_session', 'session_duration', 'lead_created', 'hotspot_view', 'animation_play', 'user_register', 'user_login', 'brochure_download', 'quote_request', 'time_spent', 'button_click', 'model_rotation', 'like', 'comment', 'share', 'download', 'follow', 'bookmark', 'search', 'exit_intent', 'contact_sales'));

-- 2. Creator Profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio text,
  website text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  followers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Social Interactions (Likes/Bookmarks)
CREATE TABLE IF NOT EXISTS hub_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'catalog', 'comment')),
  entity_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'bookmark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id, interaction_type)
);

-- 4. Comments
CREATE TABLE IF NOT EXISTS hub_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'catalog')),
  entity_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES hub_comments(id) ON DELETE CASCADE,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Followers
CREATE TABLE IF NOT EXISTS hub_followers (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id)
);

-- 6. Moderation Reports
CREATE TABLE IF NOT EXISTS moderation_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'catalog', 'comment', 'creator')),
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Hidden', 'Dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for Hub
CREATE INDEX IF NOT EXISTS idx_products_is_public ON products(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_catalogs_is_public ON catalogs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_hub_interactions_entity ON hub_interactions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hub_comments_entity ON hub_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);

-- ==========================================
-- PHASE 1 MVP MIGRATIONS
-- ==========================================

-- Lead Management Improvements
ALTER TABLE leads ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Normal';
DO $$ BEGIN
  ALTER TABLE leads ADD CONSTRAINT leads_priority_check CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent'));
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

-- Profile Module Improvements
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Full-text search indexes for Global Search
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(category,'') || ' ' || COALESCE(description,'')));
CREATE INDEX IF NOT EXISTS idx_catalogs_fts ON catalogs USING gin(to_tsvector('english', name || ' ' || COALESCE(description,'')));
CREATE INDEX IF NOT EXISTS idx_leads_fts ON leads USING gin(to_tsvector('english', name || ' ' || COALESCE(company,'') || ' ' || email));


-- ==========================================
-- AI ENGINE & ML PIPELINE SCHEMA
-- ==========================================

-- 1. ML Feature Store
CREATE TABLE IF NOT EXISTS ml_feature_store (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL CHECK (entity_type IN ('user', 'lead', 'product', 'catalog', 'session')),
  entity_id uuid NOT NULL,
  feature_name text NOT NULL,
  feature_value numeric,
  feature_vector jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, feature_name)
);

-- 2. ML Models Registry
CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  version text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Training' CHECK (status IN ('Training', 'Active', 'Archived', 'Failed')),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_data bytea, -- serialized model or external reference
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

-- 3. AI Predictions Cache
CREATE TABLE IF NOT EXISTS ai_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id uuid REFERENCES ml_models(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  prediction_type text NOT NULL, -- e.g., 'conversion_probability', 'category_affinity'
  prediction_value numeric,
  prediction_data jsonb,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(model_id, entity_type, entity_id, prediction_type)
);

-- 4. AI Insights Log (for Sales Assistant)
CREATE TABLE IF NOT EXISTS ai_insights_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'lead', 'product', 'company'
  entity_id uuid NOT NULL,
  insight_type text NOT NULL, -- 'action_required', 'trend_spotted', 'anomaly'
  message text NOT NULL,
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for AI Tables
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_entity ON ml_feature_store(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_log_company ON ai_insights_log(company_id, is_dismissed);

-- ==========================================
-- AI SUPPORT CENTER SCHEMA
-- ==========================================

-- 1. Modify Support Tickets
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS conversation_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sentiment text DEFAULT 'Neutral' CHECK (sentiment IN ('Happy', 'Neutral', 'Confused', 'Frustrated', 'Angry', 'Urgent'));
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolution_time integer;
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;

-- 2. Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company ON knowledge_base(company_id);

-- 3. Chatbot Sessions
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  visitor_id text,
  current_page text,
  context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  message_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'Escalated')),
  escalated_ticket_id uuid REFERENCES support_tickets(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_company ON chatbot_sessions(company_id, status);

-- ==========================================
-- MOBILE INTEGRATION & SYNC SCHEMA
-- ==========================================

-- 1. User Devices (For Push Notifications & Deep Linking)
CREATE TABLE IF NOT EXISTS user_devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  fcm_token text,
  platform text NOT NULL CHECK (platform IN ('Android', 'iOS', 'Web')),
  os_version text,
  app_version text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

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

-- 3. Session Management Table (Zero Trust tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  device_info text,
  ip_address text,
  is_revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(refresh_token_hash);

-- 4. Audit Logs (Enterprise Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL, -- e.g., 'login_success', 'mfa_enabled', 'lead_deleted', 'qr_generated'
  entity_type text, -- e.g., 'user', 'lead', 'product'
  entity_id text,
  details jsonb, -- Arbitrary metadata
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 5. Security Alerts (Threat Detection)
DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  alert_type text NOT NULL, -- e.g., 'Brute Force Attempt', 'New Device Login'
  severity alert_severity NOT NULL DEFAULT 'Medium',
  is_resolved boolean NOT NULL DEFAULT false,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_security_alerts_company ON security_alerts(company_id, is_resolved);
