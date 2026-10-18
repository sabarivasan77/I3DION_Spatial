-- Migration: 0009_qr_shortlinks_and_attribution.sql
-- Description: Enhances qr_codes table with >= 96-bit short links, pause/expiry/password controls, campaign attribution, and visit counters.

BEGIN;

-- 1. Add short link and attribution columns to qr_codes
ALTER TABLE qr_codes
  ALTER COLUMN product_id DROP NOT NULL,
  ALTER COLUMN png_url DROP NOT NULL,
  ALTER COLUMN svg_url DROP NOT NULL,
  ALTER COLUMN generated_at SET DEFAULT now();

ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS short_code VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS visits_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;

-- 2. Create index for fast O(1) short code resolution
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code 
  ON qr_codes (short_code);

CREATE INDEX IF NOT EXISTS idx_qr_codes_org_campaign 
  ON qr_codes (organization_id, campaign);

COMMIT;
