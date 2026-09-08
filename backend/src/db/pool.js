import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ...( (config.nodeEnv === 'production' || config.databaseUrl?.includes('sslmode=') || config.databaseUrl?.includes('supabase') || config.databaseUrl?.includes('neon') || config.databaseUrl?.includes('render')) && {
    ssl: { rejectUnauthorized: false }
  })
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

let migrationRun = false;

export async function ensureMigrated() {
  if (migrationRun) return;
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    
    // V2 Tables & Columns
    await pool.query(`
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
        passcode_hash text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        email_notifications boolean NOT NULL DEFAULT true,
        in_app_notifications boolean NOT NULL DEFAULT true,
        weekly_digest boolean NOT NULL DEFAULT true,
        lead_alerts boolean NOT NULL DEFAULT true,
        security_alerts boolean NOT NULL DEFAULT true,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS weekly_reports (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        report_period_start timestamptz NOT NULL,
        report_period_end timestamptz NOT NULL,
        metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
        pdf_report_url text,
        sent_to_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS automation_rules (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        rule_name text NOT NULL,
        trigger_event text NOT NULL,
        conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
        action_type text NOT NULL,
        action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Non-blocking schema enhancements
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'PUBLIC';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'PUBLISHED';
    `).catch(() => {});

    migrationRun = true;
  } catch (err) {
    console.error('Database migration check failed:', err.message);
  }
}

export async function migrate() {
  await ensureMigrated();
}
