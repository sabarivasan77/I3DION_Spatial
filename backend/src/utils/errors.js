export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;
  const isDev = process.env.NODE_ENV !== 'production';
  const payload = {
    message: status === 500
      ? (isDev && error.message ? error.message : 'Internal server error')
      : error.message,
    error: error.message,
    details: error.details ?? { originalError: error.message, stack: isDev ? error.stack : undefined },
  };

  if (status === 500) {
    console.error(`[API 500 Error] ${error.message}`, error.stack);
  }

  res.status(status).json(payload);
}
