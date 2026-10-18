-- ============================================================================
-- Migration 0004: Durable Flow Queue, Checkpoints, Timers & Idempotency (Phase P2)
-- Implements Master Prompt v5.0 §6, §9 & BUG-01/02/03
-- ============================================================================

-- 1. Extend flow_runs table with checkpointing & durable timer columns
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS current_step_index integer NOT NULL DEFAULT 0;
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS execution_context jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS resume_at timestamptz;
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3;
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS dead_letter_reason text;
ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS last_heartbeat timestamptz;

-- 2. Create durable flow_queue table for PostgreSQL FOR UPDATE SKIP LOCKED job execution
CREATE TABLE IF NOT EXISTS flow_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES flow_runs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'waiting_delay', 'waiting_approval', 'completed', 'failed', 'dead_letter')),
  priority integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for high-throughput concurrency and SKIP LOCKED worker polling
CREATE INDEX IF NOT EXISTS idx_flow_queue_claim ON flow_queue(status, next_run_at, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_flow_queue_tenant ON flow_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_flow_queue_run_id ON flow_queue(run_id);

-- 3. Create flow_step_checkpoints table for strict step-level idempotency
CREATE TABLE IF NOT EXISTS flow_step_checkpoints (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES flow_runs(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  step_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'succeeded',
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flow_checkpoints_run_step ON flow_step_checkpoints(run_id, step_id);
CREATE INDEX IF NOT EXISTS idx_flow_checkpoints_idempotency ON flow_step_checkpoints(idempotency_key);

-- 4. Enable Row Level Security (RLS) on newly created tables
ALTER TABLE flow_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_step_checkpoints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY flow_queue_tenant_isolation ON flow_queue
    FOR ALL
    USING (organization_id = current_setting('app.org_id', true)::uuid)
    WITH CHECK (organization_id = current_setting('app.org_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY flow_step_checkpoints_tenant_isolation ON flow_step_checkpoints
    FOR ALL
    USING (organization_id = current_setting('app.org_id', true)::uuid)
    WITH CHECK (organization_id = current_setting('app.org_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN null; END $$;
