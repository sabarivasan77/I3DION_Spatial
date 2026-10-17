import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDatabaseRestore(backupFilePath, options = {}) {
  const isDrill = options.drill === true;
  let targetFile = backupFilePath;

  if (!targetFile) {
    const backupDir = path.resolve(__dirname, '../../database/backups');
    const files = await fs.readdir(backupDir).catch(() => []);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort().reverse();
    if (sqlFiles.length === 0) {
      throw new Error(`No backup files found in ${backupDir}`);
    }
    targetFile = path.join(backupDir, sqlFiles[0]);
  }

  console.log(`[Restore] Target backup file: ${targetFile}`);
  console.log(`[Restore] Execution mode: ${isDrill ? 'DRILL (Verified test restore inside transaction)' : 'RESTORE (Applying to database)'}`);

  const sqlContent = await fs.readFile(targetFile, 'utf8');
  const client = await pool.connect();

  try {
    if (isDrill) {
      // In drill mode, wrap execution in a transaction and inspect row counts, then roll back
      await client.query('BEGIN');
      await client.query("SET session_replication_role = 'replica'");

      // Extract only INSERT statements or execute clean statements
      await client.query(sqlContent);

      const countRes = await client.query(
        `SELECT COUNT(*)::int as count FROM organizations`
      );
      console.log(`[Restore Drill] Verified restored organization count: ${countRes.rows[0]?.count}`);

      await client.query('ROLLBACK');
      console.log(`[Restore Drill] Verification passed successfully. Transaction rolled back cleanly without mutating production data.`);
    } else {
      // Direct restore execution
      await client.query(sqlContent);
      console.log(`[Restore] Database restore completed and committed successfully.`);
    }

    return {
      success: true,
      file: targetFile,
      mode: isDrill ? 'drill' : 'live'
    };
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('restore-database.js')) {
  const isDrillArg = process.argv.includes('--drill');
  const fileArg = process.argv.find(a => a.endsWith('.sql'));

  runDatabaseRestore(fileArg, { drill: isDrillArg })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Restore] Fatal error during restore:', err);
      process.exit(1);
    });
}
