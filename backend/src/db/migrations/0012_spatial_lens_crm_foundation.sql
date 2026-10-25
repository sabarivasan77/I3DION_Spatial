-- =============================================================================
-- Migration: 0012_spatial_lens_crm_foundation.sql
-- Description: Spatial Lens CRM Foundation, Shared Business Entities, Sales Deals & Tasks
-- Scope: Multi-tenant CRM Accounts, Contacts, Deals, Tasks, Enquiries, Documents, and Dashboards
-- =============================================================================

-- 1. CRM Accounts (Company / Customer Organizations)
CREATE TABLE IF NOT EXISTS crm_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  website text,
  phone text,
  address text,
  tier text NOT NULL DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Strategic', 'Enterprise')),
  annual_revenue numeric DEFAULT 0,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_accounts_org ON crm_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name ON crm_accounts(organization_id, name);

-- 2. CRM Contacts (Individual Business People)
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  email text NOT NULL,
  phone text,
  title text,
  department text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON crm_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(organization_id, email);

-- 3. CRM Deals (Sales Pipeline Opportunities)
CREATE TABLE IF NOT EXISTS crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES crm_accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stage text NOT NULL DEFAULT 'Discovery' CHECK (stage IN ('Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  probability integer NOT NULL DEFAULT 20,
  expected_close_date date,
  actual_close_date date,
  loss_reason text,
  next_step text,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_org_stage ON crm_deals(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_account ON crm_deals(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_close_date ON crm_deals(organization_id, expected_close_date);

-- 4. CRM Tasks (Sales Activities, Follow-ups, and Reminders)
CREATE TABLE IF NOT EXISTS crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE CASCADE,
  account_id uuid REFERENCES crm_accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'follow_up' CHECK (task_type IN ('follow_up', 'call', 'meeting', 'demo', 'quote', 'task')),
  priority text NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  due_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Canceled')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_org_status ON crm_tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned ON crm_tasks(assigned_to);

-- 5. CRM Documents (Sales Contracts, Quotes, and Attachments)
CREATE TABLE IF NOT EXISTS crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('quote', 'contract', 'specification', 'nda', 'general')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_documents_org ON crm_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_deal ON crm_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_account ON crm_documents(account_id);

-- 6. Lens Dashboard Configurations (Persisted Custom Widgets and Layouts)
CREATE TABLE IF NOT EXISTS lens_dashboard_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Dashboard',
  is_shared boolean NOT NULL DEFAULT false,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lens_dashboard_configs_user ON lens_dashboard_configs(organization_id, user_id);

-- 7. Extend support_tickets with CRM relationship links if not present
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Normal';

-- 8. Enable Multi-Tenant Row Level Security (RLS) on all CRM tables
ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts FORCE ROW LEVEL SECURITY;

ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals FORCE ROW LEVEL SECURITY;

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks FORCE ROW LEVEL SECURITY;

ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_documents FORCE ROW LEVEL SECURITY;

ALTER TABLE lens_dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_dashboard_configs FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_accounts' AND policyname = 'tenant_isolation_crm_accounts') THEN
    CREATE POLICY tenant_isolation_crm_accounts ON crm_accounts AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_contacts' AND policyname = 'tenant_isolation_crm_contacts') THEN
    CREATE POLICY tenant_isolation_crm_contacts ON crm_contacts AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_deals' AND policyname = 'tenant_isolation_crm_deals') THEN
    CREATE POLICY tenant_isolation_crm_deals ON crm_deals AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_tasks' AND policyname = 'tenant_isolation_crm_tasks') THEN
    CREATE POLICY tenant_isolation_crm_tasks ON crm_tasks AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_documents' AND policyname = 'tenant_isolation_crm_documents') THEN
    CREATE POLICY tenant_isolation_crm_documents ON crm_documents AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lens_dashboard_configs' AND policyname = 'tenant_isolation_lens_dashboard_configs') THEN
    CREATE POLICY tenant_isolation_lens_dashboard_configs ON lens_dashboard_configs AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;
END $$;
