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
  const payload = {
    message: status === 500 ? 'Internal server error' : error.message,
    details: error.details ?? { originalError: error.message, stack: error.stack },
  };

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json(payload);
}
