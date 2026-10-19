let appInstance = null;

export default async function handler(req, res) {
  try {
    if (!appInstance) {
      const serverModule = await import('../backend/src/server.js');
      appInstance = serverModule.app;
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

