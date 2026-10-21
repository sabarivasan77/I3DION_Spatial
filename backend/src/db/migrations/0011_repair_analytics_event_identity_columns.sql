-- Repair older deployments that recorded the baseline schema before
-- analytics_events gained the identity/session columns used by Lens indexes.
-- This is additive and safe to run against both new and existing databases.

ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id text;

CREATE INDEX IF NOT EXISTS idx_intel_events_user
  ON analytics_events(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intel_events_session
  ON analytics_events(session_id) WHERE session_id IS NOT NULL;
