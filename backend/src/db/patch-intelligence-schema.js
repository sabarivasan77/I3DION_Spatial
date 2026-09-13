import { query } from './pool.js';

export async function patchIntelligenceSchema() {
  console.log('[DB Migration] Patching Intelligence Engine Schema...');

  try {
    // 1. Extend analytics_events table with generic intelligence fields
    await query(`
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS session_id text;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS project_id text;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS application_id text;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS entity_type text;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS entity_id text;
      ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS source text DEFAULT 'web_app';
      ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
    `);

    // 2. Create intelligence_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_sessions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id text NOT NULL UNIQUE,
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
        visitor_id text,
        application_id text DEFAULT 'hub',
        project_id text,
        started_at timestamptz NOT NULL DEFAULT now(),
        ended_at timestamptz,
        last_active_at timestamptz NOT NULL DEFAULT now(),
        duration_seconds integer DEFAULT 0,
        apps_opened jsonb DEFAULT '[]'::jsonb,
        products_viewed jsonb DEFAULT '[]'::jsonb,
        experiences_opened jsonb DEFAULT '[]'::jsonb,
        searches_performed jsonb DEFAULT '[]'::jsonb,
        interactions_count integer DEFAULT 0,
        cta_clicks_count integer DEFAULT 0,
        engagement_depth_score numeric DEFAULT 0.0,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 3. Create user_behavior_profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS user_behavior_profiles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        visitor_id text,
        lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
        category_weights jsonb DEFAULT '{}'::jsonb,
        industry_weights jsonb DEFAULT '{}'::jsonb,
        product_interactions jsonb DEFAULT '{}'::jsonb,
        experience_interactions jsonb DEFAULT '{}'::jsonb,
        frequently_used_apps jsonb DEFAULT '{}'::jsonb,
        engagement_score numeric DEFAULT 0.0,
        intent_score numeric DEFAULT 0.0,
        lead_classification text DEFAULT 'COLD',
        last_activity_at timestamptz DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 4. Create algorithm_configs table
    await query(`
      CREATE TABLE IF NOT EXISTS algorithm_configs (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        recency_decay_half_life_days integer DEFAULT 14,
        frequency_weight numeric DEFAULT 1.5,
        recency_weight numeric DEFAULT 2.0,
        depth_weight numeric DEFAULT 1.2,
        intent_weight numeric DEFAULT 3.0,
        lead_cold_threshold numeric DEFAULT 24.0,
        lead_warm_threshold numeric DEFAULT 49.0,
        lead_hot_threshold numeric DEFAULT 74.0,
        lead_high_intent_threshold numeric DEFAULT 100.0,
        custom_rules jsonb DEFAULT '[]'::jsonb,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 5. Create intelligence_audit_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_audit_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        action text NOT NULL,
        entity_type text,
        entity_id text,
        details jsonb DEFAULT '{}'::jsonb,
        ip_address text,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Indexes for high-performance querying
    await query(`
      CREATE INDEX IF NOT EXISTS idx_intel_events_org ON analytics_events(organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_intel_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_intel_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_intel_events_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_intel_sessions_org ON intelligence_sessions(organization_id, last_active_at DESC);
      CREATE INDEX IF NOT EXISTS idx_intel_behavior_org ON user_behavior_profiles(organization_id);
    `);

    console.log('[DB Migration] Intelligence Engine Schema patched successfully.');
  } catch (err) {
    console.error('[DB Migration Error] Failed patching Intelligence Engine Schema:', err);
  }
}
