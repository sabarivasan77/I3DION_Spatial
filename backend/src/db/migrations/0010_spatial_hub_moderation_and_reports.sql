-- Migration: 0010_spatial_hub_moderation_and_reports.sql
-- Description: Creates moderation_reports table for community content reporting and abuse prevention (HUB-15).

BEGIN;

CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient moderation review and querying
CREATE INDEX IF NOT EXISTS idx_moderation_reports_entity 
  ON moderation_reports (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_status 
  ON moderation_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter 
  ON moderation_reports (reporter_id);

COMMIT;
