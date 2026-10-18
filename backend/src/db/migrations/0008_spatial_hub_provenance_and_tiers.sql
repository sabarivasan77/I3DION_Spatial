-- Migration: 0008_spatial_hub_provenance_and_tiers.sql
-- Description: Adds model provenance, license metadata, tiered asset URLs, and indexes for Spatial Hub.
-- Demotes legacy fake/unlicensed models from public feed.

BEGIN;

-- 1. Add provenance, license, and asset tiers to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS license_spdx TEXT[] DEFAULT ARRAY['CC0-1.0']::TEXT[],
  ADD COLUMN IF NOT EXISTS license_artist TEXT,
  ADD COLUMN IF NOT EXISTS license_owner TEXT,
  ADD COLUMN IF NOT EXISTS license_source_url TEXT,
  ADD COLUMN IF NOT EXISTS attribution_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commercial_use BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_demo_model BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preview_model_url TEXT,
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS full_model_url TEXT,
  ADD COLUMN IF NOT EXISTS original_model_url TEXT;

-- 2. Add license and tier columns to vault_assets
ALTER TABLE vault_assets
  ADD COLUMN IF NOT EXISTS license_spdx TEXT[] DEFAULT ARRAY['CC0-1.0']::TEXT[],
  ADD COLUMN IF NOT EXISTS license_artist TEXT,
  ADD COLUMN IF NOT EXISTS license_owner TEXT,
  ADD COLUMN IF NOT EXISTS license_source_url TEXT,
  ADD COLUMN IF NOT EXISTS attribution_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commercial_use BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_demo_model BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- 3. Create index for fast hub feed querying
CREATE INDEX IF NOT EXISTS idx_products_hub_feed 
  ON products (is_public, status, created_at DESC)
  WHERE is_public = true AND status = 'Published';

CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON products (slug);

-- 4. Demote legacy unverified/renamed models from public visibility (HUB-01..03)
UPDATE products
SET is_public = false,
    status = 'Archived',
    updated_at = now()
WHERE model_url LIKE '/models/model_%.gltf';

-- 5. Ensure Showcase Organization exists for demonstration models
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

INSERT INTO organizations (id, name, slug, profile, website, is_verified, created_at, updated_at)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'I3DION Showcase',
  'i3dion-showcase',
  'Official demonstration and reference models for the I3DION Spatial Hub ecosystem. All models carry verifiable CC0 or CC-BY open source licenses.',
  'https://i3dion.com',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  profile = EXCLUDED.profile,
  is_verified = true,
  updated_at = now();

COMMIT;
