import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from '../schemas.js';
import { createResetToken, hashToken, signAccessToken } from '../services/tokens.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

export const authRouter = Router();

async function sessionPayload(user, req) {
  const token = signAccessToken(user);
  const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

  await query(
    `INSERT INTO user_sessions (user_id, company_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`,
    [
      user.id,
      user.company_id,
      hashToken(token),
      req.ip || null,
      req.get('user-agent') || null,
      decoded.exp,
    ],
  );

  return {
    token,
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
       VALUES ($1, $2, $3, $4, 'Admin')
       RETURNING id, company_id, name, email, role`,
      [company.rows[0].id, name, email, passwordHash],
    );

    res.status(201).json(await sessionPayload(user.rows[0], req));
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.validated.body;
    const { rows } = await query(
      'SELECT id, company_id, name, email, role, password_hash FROM users WHERE email = $1',
      [email],
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    res.json(await sessionPayload(user, req));
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await query('UPDATE user_sessions SET revoked_at = now() WHERE token_hash = $1', [req.tokenHash]);
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
