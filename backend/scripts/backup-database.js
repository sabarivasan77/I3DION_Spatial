import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDatabaseBackup(options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = options.outputDir || path.resolve(__dirname, '../../database/backups');
  await fs.mkdir(backupDir, { recursive: true });

  const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
  const metaFile = path.join(backupDir, `backup_${timestamp}.meta.json`);

  console.log(`[Backup] Initiating I3DION database backup...`);
  console.log(`[Backup] Target file: ${backupFile}`);

  // Fetch all user tables in public schema
  const tableRes = await pool.query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );

  const tables = tableRes.rows.map(r => r.table_name);
  const tableStats = {};
  let totalRows = 0;

  const sqlChunks = [
    `-- ================================================================`,
    `-- I3DION Spatial Platform: Database Backup`,
    `-- Timestamp: ${new Date().toISOString()}`,
    `-- Total Tables: ${tables.length}`,
    `-- ================================================================\n`,
    `BEGIN;\n`,
    `SET session_replication_role = 'replica'; -- Temporarily bypass FK constraints for clean restore\n`
  ];

  for (const table of tables) {
    try {
      const colRes = await pool.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );
      const columns = colRes.rows.map(c => c.column_name);
      const colTypeMap = {};
      for (const c of colRes.rows) {
        colTypeMap[c.column_name] = c.data_type;
      }

      const rowsRes = await pool.query(`SELECT * FROM "${table}"`);
      const rows = rowsRes.rows;
      tableStats[table] = rows.length;
      totalRows += rows.length;

      sqlChunks.push(`-- Table: ${table} (${rows.length} rows)`);
      sqlChunks.push(`DELETE FROM "${table}";`);

      if (rows.length > 0) {
        const colList = columns.map(c => `"${c}"`).join(', ');
        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            const colType = (colTypeMap[col] || '').toLowerCase();
            if (val instanceof Date || colType.includes('timestamp') || colType.includes('date')) {
              const d = val instanceof Date ? val : new Date(val);
              return isNaN(d.getTime()) ? 'NULL' : `'${d.toISOString()}'::timestamptz`;
            }
            if (colType.includes('json')) {
              return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            if (colType.includes('array') || Array.isArray(val)) {
              const arrayLiteral = '{' + (Array.isArray(val) ? val : [val]).map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(',') + '}';
              return `'${arrayLiteral.replace(/'/g, "''")}'`;
            }
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return val;
            if (typeof val === 'object' && val !== null) {
              return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          sqlChunks.push(`INSERT INTO "${table}" (${colList}) VALUES (${values.join(', ')});`);
        }
      }
      sqlChunks.push('');
    } catch (err) {
      console.warn(`[Backup] Warning reading table ${table}:`, err.message);
    }
  }

  sqlChunks.push(`SET session_replication_role = 'origin'; -- Restore standard constraint checks`);
  sqlChunks.push(`COMMIT;\n`);

  const fullSql = sqlChunks.join('\n');
  await fs.writeFile(backupFile, fullSql, 'utf8');

  const meta = {
    timestamp: new Date().toISOString(),
    filename: path.basename(backupFile),
    totalTables: tables.length,
    totalRows,
    tableStats
  };
  await fs.writeFile(metaFile, JSON.stringify(meta, null, 2), 'utf8');

  console.log(`[Backup] Backup completed successfully.`);
  console.log(`[Backup] Rows backed up: ${totalRows} across ${tables.length} tables.`);
  console.log(`[Backup] SQL Dump Size: ${(fullSql.length / 1024).toFixed(2)} KB\n`);

  return { backupFile, metaFile, totalRows, totalTables: tables.length, tableStats };
}

if (process.argv[1] && process.argv[1].endsWith('backup-database.js')) {
  runDatabaseBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Backup] Fatal error during backup:', err);
      process.exit(1);
    });
}
