-- =============================================================================
-- Migration: 0006_engine_scene_document_and_circuits.sql
-- Description: Omni Engine Scene Document, Keyframes & Circuits IR (Phase P8)
-- Requirements: Non-destructive scene document, optimistic revision locking (409),
--               circuit visual graph definition and compiled IR persistence.
-- =============================================================================

ALTER TABLE spatial_experiences
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scene_document jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS circuits_graph jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS circuits_ir jsonb DEFAULT '{"entrypoints": {}, "handlers": {}}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_spatial_experiences_org_rev 
  ON spatial_experiences(organization_id, revision);

-- Whitelist experience.published in analytics_events
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
    'basket.item_added'::text, 'rfq.submitted'::text, 'download.pdf'::text, 'share.clicked'::text,
    'experience.published'::text
  ])
);

