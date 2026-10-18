-- Migration 0003: Catalog Player PWA, Short Links, QR Campaigns & Server-Side Audience Filtering
-- Enforces Row-Level Security for catalog_links table.

CREATE TABLE IF NOT EXISTS catalog_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    catalog_id UUID REFERENCES catalogs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
    short_code VARCHAR(32) NOT NULL UNIQUE,
    label TEXT NOT NULL DEFAULT 'Default Link',
    campaign TEXT NOT NULL DEFAULT 'Direct',
    audience_role VARCHAR(32) NOT NULL DEFAULT 'public',
    allowed_fields JSONB DEFAULT '[]'::jsonb,
    hidden_fields JSONB DEFAULT '[]'::jsonb,
    password_hash VARCHAR(255),
    expires_at TIMESTAMPTZ,
    dealer_info JSONB DEFAULT '{}'::jsonb,
    qr_svg TEXT,
    qr_png_url TEXT,
    visits_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_links_short_code ON catalog_links(short_code);
CREATE INDEX IF NOT EXISTS idx_catalog_links_org ON catalog_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_links_catalog ON catalog_links(catalog_id);

-- Enable and Force Row Level Security
ALTER TABLE catalog_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_catalog_links ON catalog_links;
CREATE POLICY tenant_isolation_catalog_links ON catalog_links
    FOR ALL
    TO i3dion_app
    USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid)
    WITH CHECK (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);

-- Ensure leads table supports RFQ metadata, intent and message
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent TEXT DEFAULT 'quote';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS message TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_metadata_idempotency ON leads USING gin (metadata);

-- Section 4.6 Whitelisted Catalog Player Events constraint update
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check CHECK (
  event_type = ANY (ARRAY[
    'page_view'::text, 'product_view'::text, 'catalog_view'::text, 'catalog_generated'::text, 'catalog_downloaded'::text,
    'product_visit_from_catalog'::text, 'qr_scan_from_catalog'::text, 'qr_scan'::text, 'qr_landing'::text, 'qr_preview'::text,
    'qr_download'::text, '3d_interaction'::text, 'hotspot_click'::text, 'hotspot_view'::text, 'animation_play'::text,
    'blueprint_toggle'::text, 'ar_launch'::text, 'ar_session'::text, 'ar_launch_attempt'::text, 'ar_session_success'::text,
    'ar_unsupported_fallback'::text, 'cta_quote_click'::text, 'lead_form_submitted'::text, 'dwell_time_ping'::text,
    'session_duration'::text, 'lead_created'::text, 'user_register'::text, 'user_login'::text, 'brochure_download'::text,
    'quote_request'::text, 'time_spent'::text, 'button_click'::text, 'model_rotation'::text, 'search'::text,
    'exit_intent'::text, 'contact_sales'::text, 'model_download'::text,
    'catalog.viewed'::text, 'page.viewed'::text, 'product.viewed'::text, 'hotspot.opened'::text,
    'viewer.3d_interacted'::text, 'ar.launch_attempted'::text, 'ar.launch_succeeded'::text,
    'basket.item_added'::text, 'rfq.submitted'::text, 'download.pdf'::text, 'share.clicked'::text
  ])
);


