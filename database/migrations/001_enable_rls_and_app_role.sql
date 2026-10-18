-- Migration: 001_enable_rls_and_app_role.sql
-- Enforces Phase S2: Multi-Tenant Row Level Security and unprivileged application role

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'i3dion_app') THEN
    CREATE ROLE i3dion_app WITH LOGIN PASSWORD 'i3dion_app_secret' NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

GRANT i3dion_app TO postgres;
GRANT USAGE ON SCHEMA public TO i3dion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO i3dion_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO i3dion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO i3dion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO i3dion_app;

-- Enable RLS and tenant_isolation_policy on all tables containing organization_id
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      AND c.column_name = 'organization_id'
  ) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', rec.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', rec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', rec.table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (organization_id = NULLIF(current_setting(''app.org_id'', true), '''')::uuid) WITH CHECK (organization_id = NULLIF(current_setting(''app.org_id'', true), '''')::uuid);',
      rec.table_name
    );
  END LOOP;
END $$;

-- Organizations table RLS (scoped by id = app.org_id)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON organizations;
CREATE POLICY tenant_isolation_policy ON organizations
  FOR ALL
  USING (id = NULLIF(current_setting('app.org_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.org_id', true), '')::uuid);
