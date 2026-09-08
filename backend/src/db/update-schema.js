import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  let content = await fs.readFile(schemaPath, 'utf8');

  // Basic replacements
  content = content.replace(/\bcompanies\b/g, 'organizations');
  content = content.replace(/\bcompany_id\b/g, 'organization_id');
  content = content.replace(/\bcompany\b/g, 'organization');
  // There is a 'company text' in leads table, this might get renamed to 'organization text' but that's fine.
  // We need to add organization_members and organization_domains

  if (!content.includes('organization_members')) {
    content += `
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'Viewer',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS organization_domains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verification_status text NOT NULL DEFAULT 'Pending',
  verification_token text,
  verified_at timestamptz,
  auto_join_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domain)
);
`;
  }

  await fs.writeFile(schemaPath, content);
  console.log('schema.sql updated successfully.');
}

run();
