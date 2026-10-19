import { pool } from './src/db/pool.js';

// Check indexes on products table
const idx = await pool.query(`
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'products' AND indexdef LIKE '%slug%'
`);
console.log('Slug indexes:', JSON.stringify(idx.rows, null, 2));

// Check the actual unique constraint
const constraints = await pool.query(`
  SELECT conname, contype, pg_get_constraintdef(oid) as def
  FROM pg_constraint
  WHERE conrelid = 'products'::regclass AND conname LIKE '%slug%'
`);
console.log('Slug constraints:', JSON.stringify(constraints.rows, null, 2));

process.exit(0);
