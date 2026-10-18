-- =============================================================================
-- Migration: 0005_vault_dataverse_sharepoint.sql
-- Description: Vault as Dataverse + SharePoint (Phase P3)
-- Requirements: Schema designer, 16 typed columns, relationships, folders,
--               major/minor versions, retention labels, asset_usage, hash-chained audit.
-- =============================================================================

-- 1. Create vault_folders for SharePoint-style document library hierarchy
CREATE TABLE IF NOT EXISTS vault_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES vault_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_folders_org_path ON vault_folders(organization_id, path);

-- 2. Add folder_id and retention_label to vault_assets if not exists
ALTER TABLE vault_assets
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES vault_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retention_label text;

-- 3. Create asset_usage table to track multi-product asset references (Studio/Engine/Flow)
CREATE TABLE IF NOT EXISTS asset_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES vault_assets(id) ON DELETE CASCADE,
  version_id uuid REFERENCES vault_asset_versions(id) ON DELETE SET NULL,
  consumer_type text NOT NULL, -- 'catalog', 'scene', 'page', 'flow'
  consumer_id text NOT NULL,
  consumer_name text,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_usage_org_asset ON asset_usage(organization_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_consumer ON asset_usage(consumer_type, consumer_id);

-- 4. Create vault_relationships table for Dataverse-style relational integrity
CREATE TABLE IF NOT EXISTS vault_relationships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_collection_id uuid NOT NULL REFERENCES vault_collections(id) ON DELETE CASCADE,
  target_collection_id uuid NOT NULL REFERENCES vault_collections(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('lookup', 'one_to_many', 'many_to_many')),
  on_delete text NOT NULL DEFAULT 'restrict' CHECK (on_delete IN ('restrict', 'cascade', 'set_null')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_relationships_source ON vault_relationships(organization_id, source_collection_id);
CREATE INDEX IF NOT EXISTS idx_vault_relationships_target ON vault_relationships(organization_id, target_collection_id);

-- 5. Extend vault_schema_fields to support advanced Dataverse columns
ALTER TABLE vault_schema_fields
  ADD COLUMN IF NOT EXISTS formula_definition text,
  ADD COLUMN IF NOT EXISTS rollup_definition jsonb,
  ADD COLUMN IF NOT EXISTS lookup_collection_id uuid REFERENCES vault_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lookup_field_name text,
  ADD COLUMN IF NOT EXISTS audience_restricted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_roles text[] DEFAULT ARRAY['Admin', 'Manager', 'Sales']::text[];

-- 6. Extend vault_audit_logs with cryptographic hash chaining
ALTER TABLE vault_audit_logs
  ADD COLUMN IF NOT EXISTS previous_hash text,
  ADD COLUMN IF NOT EXISTS current_hash text;

CREATE INDEX IF NOT EXISTS idx_vault_audit_logs_hash ON vault_audit_logs(organization_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_vault_records_data_gin ON vault_records USING gin (data);

-- 7. Enable RLS and Tenant Isolation on new tables
DO $$
DECLARE
  tbl text;
  new_tenant_tables text[] := ARRAY[
    'vault_folders', 'asset_usage', 'vault_relationships'
  ];
BEGIN
  FOREACH tbl IN ARRAY new_tenant_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', tbl);
      EXECUTE format('
        CREATE POLICY tenant_isolation_policy ON %I
        FOR ALL
        USING (
          NULLIF(current_setting(''app.org_id'', true), '''')::uuid IS NULL
          OR organization_id = NULLIF(current_setting(''app.org_id'', true), '''')::uuid
        )
        WITH CHECK (
          NULLIF(current_setting(''app.org_id'', true), '''')::uuid IS NULL
          OR organization_id = NULLIF(current_setting(''app.org_id'', true), '''')::uuid
        )
      ', tbl);
    END IF;
  END LOOP;
END $$;
