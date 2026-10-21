let appInstance = null;
let migrationInitialized = false;

export default async function handler(req, res) {
  try {
    if (!appInstance) {
      const serverModule = await import('../backend/src/server.js');
      appInstance = serverModule.app;
    }

    if (!migrationInitialized) {
      try {
        const { ensureMigrated } = await import('../backend/src/db/pool.js');
        await ensureMigrated();
        migrationInitialized = true;
      } catch (migErr) {
        // Do not continue to authentication routes with an unavailable or
        // partially migrated database. That previously surfaced as generic
        // login and registration failures.
        console.error('[Vercel Database Initialization Failure]', migErr.message || migErr);
        const errMsg = migErr?.message || String(migErr);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
          error: 'Service temporarily unavailable',
          message: `The database is not ready: ${errMsg}. Please ensure DATABASE_URL is properly configured in Vercel.`,
          detail: errMsg
        }));
        return;
      }
    }

    return appInstance(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Invocation Failure]', err);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: 'Vercel Function Error',
      message: err.message || 'Server initialization failed',
      tip: 'Please ensure DATABASE_URL and JWT_SECRET environment variables are set in the Vercel dashboard.'
    }));
  }
}

