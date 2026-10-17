/**
 * Granular Per-Route Rate Limiters (Annex A3 / Finding H3)
 * Implements sliding-window abuse resistance across sensitive endpoints.
 */

import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';
const testRateLimitEnabled = process.env.TEST_RATE_LIMIT === 'true';

// Helper to determine active threshold
const getLimit = (defaultLimit) => (isTest && !testRateLimitEnabled ? 5000 : defaultLimit);

/**
 * Login Rate Limiter: 20 attempts per 10 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: () => getLimit(20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please try again after 10 minutes.'
  }
});

/**
 * Signup Rate Limiter: 5 account creations per hour per IP
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: () => getLimit(5),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many account creation requests from this IP. Please try again after an hour.'
  }
});

/**
 * Password Reset Request Limiter: 10 requests per hour per IP
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: () => getLimit(10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many password reset requests. Please try again later.'
  }
});

/**
 * Password Reset Attempt Limiter: 10 attempts per 15 minutes per IP
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => getLimit(10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many password reset attempts. Please try again later.'
  }
});

/**
 * Public Leads Limiter: 10 lead submissions per hour per IP
 */
export const publicLeadsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: () => getLimit(10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Lead submission quota exceeded for this IP. Please try again later.'
  }
});

/**
 * Public Events Limiter: 120 telemetry events per minute per IP
 */
export const publicEventsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: () => getLimit(120),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Event ingestion rate limit exceeded. Please throttle telemetry dispatch.'
  }
});

/**
 * Hard Payload Cap Middleware (e.g. 4 KB cap on public event ingestion)
 */
export function enforcePayloadCap(maxBytes = 4096) {
  return (req, res, next) => {
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > maxBytes) {
      return res.status(413).json({
        status: 'error',
        code: 'PAYLOAD_TOO_LARGE',
        message: `Payload exceeds maximum allowed limit of ${maxBytes} bytes.`
      });
    }
    next();
  };
}
