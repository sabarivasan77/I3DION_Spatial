import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, withTransaction } from '../db/pool.js';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';
import { OAuth2Client } from 'google-auth-library';
import { emailProvider, EmailService } from '../services/emailService.js';

export const authRouter = Router();

const getJwtSecret = () => config.jwtSecret;
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/signup
authRouter.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
      throw new ApiError(400, 'Name, email, password, and organization name are required');
    }

    if (typeof password !== 'string' || password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    // Verify JWT secret is configured BEFORE executing any database operations (Finding C3)
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      throw new ApiError(500, 'Authentication configuration failure');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      throw new ApiError(409, 'Email is already registered');
    }

    // Hash Password before entering transaction
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Execute all account creation mutations atomically on a dedicated client (Finding C3 / Annex A6)
    const result = await withTransaction(async (client) => {
      // 1. Create Organization
      const orgRes = await client.query(
        'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
        [organizationName]
      );
      const orgId = orgRes.rows[0].id;

      // 2. Create User linked to org
      const userRes = await client.query(
        `INSERT INTO users (name, email, password_hash, organization_id, role) 
         VALUES ($1, $2, $3, $4, 'Admin') RETURNING id, name, email, role`,
        [name, normalizedEmail, passwordHash, orgId]
      );
      const user = userRes.rows[0];

      // 3. Create Organization Membership (Owner/Admin)
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'Admin')`,
        [orgId, user.id]
      );

      // 4. Create default FREE subscription
      await client.query(
        `INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status)
         VALUES ($1, 'FREE', 'monthly', 'active')
         ON CONFLICT (organization_id) DO NOTHING`,
        [orgId]
      );

      // 5. Generate JWT token INSIDE transaction so any token signing error triggers full rollback
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: orgId,
        }
      };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Registration failure:', error.message);
    next(new ApiError(500, 'Unable to complete registration. Please try again.'));
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const userRes = await query(
      'SELECT id, name, email, password_hash, organization_id, role FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const user = userRes.rows[0];

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Resolve membership. If organization_id is null, find first membership
    let orgId = user.organization_id;
    let role = user.role;

    if (!orgId) {
       const memRes = await query(
         'SELECT organization_id, role FROM organization_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1',
         [user.id]
       );
       if (memRes.rows[0]) {
         orgId = memRes.rows[0].organization_id;
         role = memRes.rows[0].role;
         
         // Update user's last active organization_id
         await query('UPDATE users SET organization_id = $1, role = $2 WHERE id = $3', [orgId, role, user.id]);
       }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        organizationId: orgId,
      }
    });
  } catch (error) {
    next(error);
  }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/google
authRouter.post('/google', async (req, res, next) => {
  try {
    const { accessToken, idToken } = req.body;
    if (!accessToken && !idToken) throw new ApiError(400, 'accessToken or idToken is required');

    let payload;
    if (accessToken) {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new ApiError(401, 'Invalid Google access token');
      payload = await resp.json();
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      throw new ApiError(401, 'Invalid Google token');
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const name = payload.name || payload.email.split('@')[0];

    // Find or create user
    let userRes = await query(
      'SELECT id, name, email, organization_id, role FROM users WHERE email = $1',
      [normalizedEmail]
    );

    let user = userRes.rows[0];
    let orgId = null;
    let role = 'Viewer';

    if (!user) {
      // Create new user & default org using transaction (Annex A6)
      await withTransaction(async (client) => {
        const orgRes = await client.query(
          'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
          [`${name}'s Workspace`]
        );
        orgId = orgRes.rows[0].id;
        
        const insertUserRes = await client.query(
          `INSERT INTO users (name, email, password_hash, organization_id, role) 
           VALUES ($1, $2, $3, $4, 'Admin') RETURNING id, name, email, role`,
          [name, normalizedEmail, 'google_oauth_managed', orgId]
        );
        user = insertUserRes.rows[0];

        await client.query(
          `INSERT INTO organization_members (organization_id, user_id, role)
           VALUES ($1, $2, 'Admin')`,
          [orgId, user.id]
        );

        await client.query(
          `INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status)
           VALUES ($1, 'FREE', 'monthly', 'active')
           ON CONFLICT (organization_id) DO NOTHING`,
          [orgId]
        );
      });
      role = 'Admin';
    } else {
      orgId = user.organization_id;
      role = user.role;
      if (!orgId) {
         const memRes = await query(
           'SELECT organization_id, role FROM organization_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1',
           [user.id]
         );
         if (memRes.rows[0]) {
           orgId = memRes.rows[0].organization_id;
           role = memRes.rows[0].role;
           await query('UPDATE users SET organization_id = $1, role = $2 WHERE id = $3', [orgId, role, user.id]);
         }
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        organizationId: orgId,
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required');

    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await query('SELECT id, name, email FROM users WHERE email = $1', [normalizedEmail]);
    const user = userRes.rows[0];

    if (user) {
      // Generate 256-bit random cryptographic token (Annex A9)
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

      // Invalidate any existing unused reset tokens for this user
      await query(
        `UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`,
        [user.id]
      ).catch(() => {});

      // Insert single-use hashed token
      await query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      const resetUrl = `${config.appUrl}/reset-password?token=${rawToken}`;
      // Log hygiene: NEVER log reset tokens or URLs to console or logs (Finding H5 / Annex A9)

      // Dispatch password reset email via emailProvider
      const emailService = new EmailService();
      const emailHtml = emailService.renderTemplate(
        'Password Reset Request',
        `<p>Hello ${user.name || 'User'},</p><p>We received a request to reset your password for your I3DION Spatial account. Click the button below to set a new password (valid for 30 minutes):</p>`,
        { label: 'Reset Password', url: resetUrl }
      );
      await emailProvider.send({
        to: user.email,
        subject: 'Reset Your I3DION Spatial Password',
        html: emailHtml,
        text: `Reset your I3DION Spatial password by visiting: ${resetUrl}`,
      }).catch((err) => console.error('Failed to dispatch password reset email:', err.message));
    }

    res.json({ message: 'If an account exists for this email, password reset instructions have been generated.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new ApiError(400, 'Token and new password are required');
    if (typeof password !== 'string' || password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    // Hash incoming token with sha256 to lookup stored hash (Annex A9)
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Atomic single-use consumption: invalidate token on first use and ensure not expired
    const tokenRes = await query(
      `UPDATE password_reset_tokens
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    const userId = tokenRes.rows[0].user_id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const updateRes = await query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 RETURNING id, email',
      [passwordHash, userId]
    );

    if (updateRes.rows.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
