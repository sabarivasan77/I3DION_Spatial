-- =============================================================================
-- Migration: 0002_enable_rls_tenant_tables.sql
-- Description: Enable PostgreSQL Row-Level Security (RLS) on all multi-tenant tables
-- Requirements: SEC-02 (Tenant Isolation via withTenant & Database RLS)
-- =============================================================================

-- 1. Create Application Role (Non-Superuser) to ensure RLS policies are strictly enforced
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'i3dion_app') THEN 
    CREATE ROLE i3dion_app NOINHERIT; 
  END IF; 
END $$;

GRANT USAGE ON SCHEMA public TO i3dion_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO i3dion_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO i3dion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO i3dion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO i3dion_app;

-- 2. Enable RLS and Tenant Isolation Policy across all Organization-scoped tables
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'vault_assets', 'vault_collections', 'vault_templates', 'vault_processing_jobs',
    'vault_audit_logs', 'vault_records', 'vault_schemas', 'vault_schema_fields',
    'vault_saved_views', 'vault_shares', 'vault_approval_workflows', 'vault_enquiries',
    'studio_projects', 'studio_project_versions', 'catalogs', 'products', 'product_assets',
    'product_relationships', 'product_animations', 'product_hotspots', 'product_assets_map',
    'flows', 'flow_runs', 'flow_versions', 'flow_event_outbox',
    'organization_members', 'organization_invitations', 'organization_domains',
    'organization_billing_info', 'leads', 'lead_activities', 'analytics_events',
    'audit_logs', 'support_tickets', 'notifications', 'notification_preferences',
    'subscriptions', 'billing_customers', 'payments', 'invoices', 'orders',
    'spatial_experiences', 'integrations', 'security_alerts', 'files'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
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

-- 3. Row-Level Security for organizations table (checks primary key id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_policy ON organizations;
    CREATE POLICY tenant_isolation_policy ON organizations
      FOR ALL
      USING (
        NULLIF(current_setting('app.org_id', true), '')::uuid IS NULL
        OR id = NULLIF(current_setting('app.org_id', true), '')::uuid
      )
      WITH CHECK (
        NULLIF(current_setting('app.org_id', true), '')::uuid IS NULL
        OR id = NULLIF(current_setting('app.org_id', true), '')::uuid
      );
  END IF;
END $$;

-- 4. Row-Level Security for users table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_policy ON users;
    CREATE POLICY tenant_isolation_policy ON users
      FOR ALL
      USING (
        NULLIF(current_setting('app.org_id', true), '')::uuid IS NULL
        OR organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid
      )
      WITH CHECK (
        NULLIF(current_setting('app.org_id', true), '')::uuid IS NULL
        OR organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid
      );
  END IF;
END $$;
