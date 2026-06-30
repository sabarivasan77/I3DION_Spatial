import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret, generateURI, verifySync } from 'otplib';
import qrcode from 'qrcode';
import { query, pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  googleAuthSchema,
  mfaVerifySchema
} from '../schemas.js';
import { createResetToken, hashToken, signAccessToken, generateRefreshToken } from '../services/tokens.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { logAudit, createSecurityAlert } from '../utils/audit.js';

export const authRouter = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '436054253649-9sjuvp1a77mal61eqmaev2ltkuk3p06i.apps.googleusercontent.com');

async function handleFailedLogin(email, ip) {
  const { rows } = await query('SELECT id, company_id, failed_login_attempts FROM users WHERE email = $1', [email]);
  if (!rows[0]) return;
  const user = rows[0];
  
  const attempts = user.failed_login_attempts + 1;
  let lockedUntil = null;

  if (attempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    createSecurityAlert({
      companyId: user.company_id,
      userId: user.id,
      alertType: 'Brute Force Attempt',
      severity: 'High',
      details: { ip, email }
    });
  }

  await query(
    'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
    [attempts, lockedUntil, user.id]
  );
}

async function handleSuccessfulLogin(user, req, res) {
  // Reset failed attempts
  await query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = null, last_login_at = now(), last_login_ip = $1 WHERE id = $2',
    [req.ip || null, user.id]
  );

  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await query(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      hashToken(refreshToken),
      req.get('user-agent') || 'Unknown',
      req.ip || null,
      expiresAt,
    ]
  );

  // Set HTTP-Only cookies for tokens
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt
  });
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    // Access tokens are typically short-lived, but we use the same config or default 7d
    expires: expiresAt 
  });

  // Track Mobile Device if provided
  const { device_id, fcm_token, platform, os_version, app_version } = req.body;
  if (device_id && platform) {
    await query(
      `INSERT INTO user_devices (user_id, device_id, fcm_token, platform, os_version, app_version, last_active_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (user_id, device_id)
       DO UPDATE SET 
         fcm_token = EXCLUDED.fcm_token,
         os_version = EXCLUDED.os_version,
         app_version = EXCLUDED.app_version,
         last_active_at = now()`,
      [user.id, device_id, fcm_token, platform, os_version, app_version]
    );
  }

  logAudit({
    companyId: user.company_id,
    userId: user.id,
    action: 'login',
    req
  });

  return {
    token: accessToken,
    user: {
      id: user.id,
      companyId: user.company_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

authRouter.post(
  '/signup',
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, companyName } = req.validated.body;
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      throw new ApiError(409, 'Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const company = await query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [companyName]);
    const user = await query(
      `INSERT INTO users (company_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Company Admin')
       RETURNING id, company_id, name, email, role`,
      [company.rows[0].id, name, email, passwordHash],
    );

    res.status(201).json(await handleSuccessfulLogin(user.rows[0], req, res));
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, mfaToken } = req.validated.body;
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new ApiError(403, 'Account temporarily locked due to multiple failed login attempts');
    }

    if (!(await bcrypt.compare(password, user.password_hash))) {
      await handleFailedLogin(email, req.ip);
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.mfa_enabled) {
      if (!mfaToken) {
        throw new ApiError(403, 'MFA token required');
      }
      const { valid } = verifySync({ token: mfaToken, secret: user.mfa_secret });
      if (!valid) {
        await handleFailedLogin(email, req.ip);
        throw new ApiError(401, 'Invalid MFA token');
      }
    }

    res.json(await handleSuccessfulLogin(user, req, res));
  }),
);

authRouter.post(
  '/google',
  validate(googleAuthSchema),
  asyncHandler(async (req, res) => {
    const { idToken } = req.validated.body;
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID || '436054253649-9sjuvp1a77mal61eqmaev2ltkuk3p06i.apps.googleusercontent.com',
      });
      payload = ticket.getPayload();
    } catch (err) {
      throw new ApiError(401, 'Invalid Google ID token');
    }

    const { email, name, sub: googleId, picture } = payload;
    
    // Check if user exists
    let { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user = rows[0];

    if (user) {
      // Link Google ID if not present
      if (!user.google_id) {
        await query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    } else {
      // Auto create for Google Auth
      const company = await query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [`${name}'s Company`]);
      const result = await query(
        `INSERT INTO users (company_id, name, email, password_hash, role, google_id, avatar_url)
         VALUES ($1, $2, $3, $4, 'Company Admin', $5, $6)
         RETURNING *`,
        [company.rows[0].id, name, email, await bcrypt.hash(Math.random().toString(36), 12), googleId, picture]
      );
      user = result.rows[0];
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new ApiError(403, 'Account temporarily locked');
    }

    res.json(await handleSuccessfulLogin(user, req, res));
  }),
);

authRouter.get(
  '/mfa/setup',
  requireAuth,
  asyncHandler(async (req, res) => {
    const secret = generateSecret();
    const otpauth = generateURI({ label: req.user.email, issuer: 'I3DION Spatial', secret });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    // Save temporary secret to user (not fully enabled yet)
    await query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secret, req.user.id]);

    res.json({ qrCodeUrl, secret });
  })
);

authRouter.post(
  '/mfa/verify',
  requireAuth,
  validate(mfaVerifySchema),
  asyncHandler(async (req, res) => {
    const { token } = req.validated.body;
    const { rows } = await query('SELECT mfa_secret FROM users WHERE id = $1', [req.user.id]);
    const secret = rows[0]?.mfa_secret;

    if (!secret) throw new ApiError(400, 'MFA setup not initiated');

    const { valid } = verifySync({ token, secret });
    if (!valid) throw new ApiError(400, 'Invalid MFA code');

    await query('UPDATE users SET mfa_enabled = true WHERE id = $1', [req.user.id]);
    
    logAudit({
      companyId: req.user.company_id,
      userId: req.user.id,
      action: 'mfa_enabled',
      req
    });

    res.json({ message: 'MFA enabled successfully' });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await query('UPDATE user_sessions SET is_revoked = true WHERE refresh_token_hash = $1', [hashToken(refreshToken)]);
    }
    res.clearCookie('refreshToken');
    
    logAudit({
      companyId: req.user.company_id,
      userId: req.user.id,
      action: 'logout',
      req
    });

    res.status(204).end();
  }),
);

authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.validated.body;
    const { token, hash } = createResetToken();
    await query(
      `UPDATE users
       SET reset_token_hash = $1, reset_token_expires_at = now() + interval '30 minutes'
       WHERE email = $2`,
      [hash, email],
    );

    res.json({
      message: 'If an account exists, a reset link has been generated.',
    });
  }),
);

authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.validated.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `UPDATE users
       SET password_hash = $1, reset_token_hash = null, reset_token_expires_at = null
       WHERE reset_token_hash = $2 AND reset_token_expires_at > now()
       RETURNING id`,
      [passwordHash, hashToken(token)],
    );

    if (!result.rows[0]) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    res.json({ message: 'Password reset successfully' });
  }),
);
