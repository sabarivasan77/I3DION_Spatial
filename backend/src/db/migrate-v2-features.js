import { query } from './pool.js';

async function migrateV2Features() {
  console.log('Starting Migration for V2 Enterprise Control, OTP, Publishing & Notifications...');

  await query(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      email text NOT NULL,
      purpose text NOT NULL,
      otp_hash text NOT NULL,
      attempts_count integer NOT NULL DEFAULT 0,
      max_attempts integer NOT NULL DEFAULT 5,
      expires_at timestamptz NOT NULL,
      verified_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS organization_invitations (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email text NOT NULL,
      role user_role NOT NULL DEFAULT 'Sales User',
      token text NOT NULL UNIQUE,
      invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'pending',
      expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
      accepted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (organization_id, email)
    );

    CREATE TABLE IF NOT EXISTS publishing_access (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      product_id uuid REFERENCES products(id) ON DELETE CASCADE,
      catalog_id uuid REFERENCES catalogs(id) ON DELETE CASCADE,
      visibility text NOT NULL DEFAULT 'PUBLIC',
      approval_status text NOT NULL DEFAULT 'PUBLISHED',
      published_by uuid REFERENCES users(id) ON DELETE SET NULL,
      published_at timestamptz NOT NULL DEFAULT now(),
      restricted_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      restricted_team_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      expires_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email_notifications jsonb NOT NULL DEFAULT '{"security": true, "leads": true, "publishing": true, "billing": true, "weekly_report": true}'::jsonb,
      in_app_notifications jsonb NOT NULL DEFAULT '{"security": true, "leads": true, "publishing": true, "billing": true, "team": true}'::jsonb,
      weekly_report_enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (organization_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      period_start timestamptz NOT NULL,
      period_end timestamptz NOT NULL,
      metrics_summary jsonb NOT NULL,
      recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
      sent_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name text NOT NULL,
      event_type text NOT NULL,
      conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
      audience_roles jsonb NOT NULL DEFAULT '["Admin", "Owner"]'::jsonb,
      channel text NOT NULL DEFAULT 'both',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  console.log('✅ Migration completed successfully!');
  process.exit(0);
}

migrateV2Features().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
