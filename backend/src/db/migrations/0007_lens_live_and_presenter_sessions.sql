-- =============================================================================
-- Migration: 0007_lens_live_and_presenter_sessions.sql
-- Description: Lens Live Analytics, AI Assist Opt-in, and Presenter Mode (Phase P9)
-- Requirements: Presenter sessions with real-time sync, AI assist strict opt-in toggle,
--               and index optimization for dealer and QR campaign rollups.
-- =============================================================================

-- 1. AI Assist Opt-in column on organizations (Decision D-10: opt-in, zero customer data training)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ai_assist_enabled boolean NOT NULL DEFAULT false;

-- 2. Presenter Mode Sessions (Innovation Item 11)
CREATE TABLE IF NOT EXISTS presenter_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  experience_id uuid REFERENCES spatial_experiences(id) ON DELETE SET NULL,
  session_code text NOT NULL UNIQUE,
  host_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_slide integer NOT NULL DEFAULT 0,
  camera_orbit jsonb NOT NULL DEFAULT '[0, 0, 5]'::jsonb,
  active_variant text,
  active_hotspot text,
  exploded_factor numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presenter_sessions_code ON presenter_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_presenter_sessions_org ON presenter_sessions(organization_id, is_active);

-- Enable RLS on presenter_sessions
ALTER TABLE presenter_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenter_sessions FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'presenter_sessions' AND policyname = 'tenant_isolation_presenter_sessions'
  ) THEN
    CREATE POLICY tenant_isolation_presenter_sessions ON presenter_sessions
      AS PERMISSIVE FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  END IF;
END $$;

-- 3. Extend vault_approval_workflows to support unified cross-product approvals (Phase P9)
ALTER TABLE vault_approval_workflows DROP CONSTRAINT IF EXISTS vault_approval_workflows_approval_status_check;
ALTER TABLE vault_approval_workflows ADD CONSTRAINT vault_approval_workflows_approval_status_check CHECK (
  approval_status = ANY (ARRAY['Draft'::text, 'Submitted'::text, 'Under Review'::text, 'Approved'::text, 'Rejected'::text, 'PENDING_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text])
);

ALTER TABLE vault_approval_workflows DROP CONSTRAINT IF EXISTS vault_approval_workflows_resource_type_check;
ALTER TABLE vault_approval_workflows ADD CONSTRAINT vault_approval_workflows_resource_type_check CHECK (
  resource_type = ANY (ARRAY['asset'::text, 'record'::text, 'catalog'::text, 'schema'::text, 'flow'::text, 'quote'::text])
);

