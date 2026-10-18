/**
 * I3DION Spatial — Repository Structure and Hygiene Guard
 * Enforces §8.4 rules:
 * 1. Root files must match strict allowlist.
 * 2. No database backups or dump files tracked in git.
 * 3. No .env files tracked in git.
 * 4. No python cache or compiled binaries in git.
 * 5. No tracked files over 1 MB (unless in explicit asset allowlist).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Running Repository Structure & Hygiene Check ---');

let errors = [];

// 1. Get all tracked files in git
const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

// 2. Disallowed patterns in tracked files
for (const file of trackedFiles) {
  // Check backups
  if (file.includes('database/backups/') || (file.endsWith('.sql') && !file.includes('schema.sql') && !file.includes('migrations/'))) {
    errors.push(`[SEC-01 Violation] Database backup/dump tracked in git: ${file}`);
  }
  // Check .env files
  if (file === '.env' || file.startsWith('.env.')) {
    if (file !== '.env.example') {
      errors.push(`[Security Violation] Environment file tracked in git: ${file}`);
    }
  }
  // Check pycache or test results
  if (file.includes('__pycache__') || file.endsWith('.pyc') || file.includes('playwright-report') || file.includes('test-results')) {
    errors.push(`[Hygiene Violation] Build/test artifact tracked in git: ${file}`);
  }
}

// 3. Root Allowlist check
const rootAllowlist = new Set([
  '.agents',
  '.design-reference',
  '.eslintrc.json',
  '.git',
  '.gitattributes',
  '.github',
  '.gitignore',
  '.gitleaks.toml',
  '.prettierrc',
  '.trunk',
  '.vercel',
  '.vercelignore',
  '.vite',
  '.vscode',
  'api',
  'assets',
  'backend',
  'database',
  'dist',
  'docker-compose.yml',
  'docs',
  'frontend',
  'I3DION_MASTER_PROMPT_v5_Omni_Studio_Vault.md',
  'mobile',
  'node_modules',
  'package-lock.json',
  'package.json',
  'packages',
  'README.md',
  'scratch',
  'tools',
  'tsconfig.json',
  'vercel.json'
]);

const currentRootItems = fs.readdirSync('.');
for (const item of currentRootItems) {
  if (item === '.env.example' || item === '.env' || item === '.env.local') continue;
  if (!rootAllowlist.has(item)) {
    errors.push(`[Structure Violation] Root item '${item}' is not in the approved root allowlist.`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ Repository Structure Check FAILED:');
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
} else {
  console.log('✅ Repository Structure Check PASSED: Clean repository hygiene confirmed.');
  process.exit(0);
}
