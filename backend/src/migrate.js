import { migrate } from './db/pool.js';

async function runMigration() {
  console.log('Starting database migration...');
  try {
    await migrate();
    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
