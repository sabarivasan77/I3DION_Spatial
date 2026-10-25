# I3DION Spatial Lens — Data & API Architecture Notes

**Target Schema Version**: Migration `0012_spatial_lens_crm_foundation.sql`  
**Security Model**: PostgreSQL Multi-Tenant Row Level Security (RLS) via `app.org_id` context

---

## 1. Relational Database Schema Design

### 1.1 `crm_accounts` (Company & Client Records)
Canonical authority for customer organizations and business accounts.
```sql
CREATE TABLE IF NOT EXISTS crm_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  website text,
  phone text,
  address text,
  tier text NOT NULL DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Strategic', 'Enterprise')),
  annual_revenue numeric,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.2 `crm_contacts` (Individual Persons)
Contacts linked to an account and/or original lead.
```sql
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
```

### 1.3 `crm_deals` (Sales Pipeline Opportunities)
Sales opportunities with structured stage progression and value tracking.
```sql
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
```

### 1.4 `crm_tasks` (Activities, Follow-ups & Reminders)
Actionable follow-up tasks linked to leads, contacts, accounts, or deals.
```sql
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
```

### 1.5 `crm_documents` (Sales & Operational Documents)
Contracts, specification sheets, and quote PDFs linked to CRM entities.
```sql
CREATE TABLE IF NOT EXISTS crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes integer NOT NULL,
  mime_type text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('quote', 'contract', 'specification', 'nda', 'general')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.6 `lens_dashboard_configs` (Persisted Dashboard Customizations)
Saved widget arrangements and user preferences.
```sql
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
```

---

## 2. API Endpoints Specification

### CRM Routes (`/api/crm`)
- `GET /api/crm/overview`: Unified sales metrics (Total leads, Open deals, Pipeline value, Won revenue, Overdue tasks, Open tickets).
- `GET /api/crm/accounts`: List accounts with contact counts, deals, and revenue rollups.
- `POST /api/crm/accounts`: Create an account with address, industry, and owner.
- `GET /api/crm/contacts`: List contacts with account affiliation and primary contact flag.
- `POST /api/crm/contacts`: Create a contact linked to an account.
- `GET /api/crm/deals`: List deals with stage filtering and owner scoping.
- `POST /api/crm/deals`: Create a deal linked to an account/contact.
- `PATCH /api/crm/deals/:id/stage`: Update deal stage (supports Kanban drag-and-drop).
- `POST /api/crm/leads/:id/convert`: Convert lead to Account + Contact + optional Deal in a single atomic database transaction.
- `GET /api/crm/tasks`: List tasks with filter by status (`Pending`/`Completed`), due date, and overdue flag.
- `POST /api/crm/tasks`: Create a task with due date, reminder, and priority.
- `PATCH /api/crm/tasks/:id/status`: Toggle task status (`Completed`/`Pending`).
- `GET /api/crm/enquiries`: List customer enquiries with linked account/contact data.
- `POST /api/crm/enquiries`: Create customer enquiry.
- `PATCH /api/crm/enquiries/:id`: Update enquiry status and internal notes.
- `GET /api/crm/documents`: List uploaded sales documents.
- `POST /api/crm/documents`: Attach document record.
- `GET /api/crm/dashboard-config`: Retrieve user's customized widget layout.
- `PUT /api/crm/dashboard-config`: Persist customized widget layout.
