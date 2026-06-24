import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

export async function migrate() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}
