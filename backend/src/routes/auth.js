import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';
import { OAuth2Client } from 'google-auth-library';

export const authRouter = Router();

const JWT_SECRET = config.jwtSecret || 'dev_jwt_secret_do_not_use_in_prod';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/signup
authRouter.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
      throw new ApiError(400, 'Name, email, password, and organization name are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      throw new ApiError(409, 'Email is already registered');
    }

    // Begin transaction
    await query('BEGIN');

    // 1. Create Organization
    const orgRes = await query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [organizationName]
    );
    const orgId = orgRes.rows[0].id;

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create User (Link to org as primary organization_id)
    const userRes = await query(
      `INSERT INTO users (name, email, password_hash, organization_id, role) 
       VALUES ($1, $2, $3, $4, 'Admin') RETURNING id, name, email, role`,
      [name, normalizedEmail, passwordHash, orgId]
    );
    const user = userRes.rows[0];

    // 4. Create Organization Membership (Owner/Admin)
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'Admin')`,
      [orgId, user.id]
    );

    // Commit transaction
    await query('COMMIT');

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: orgId,
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    next(error);
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
      JWT_SECRET,
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
      // Create new user & default org using transaction
      await query('BEGIN');
      const orgRes = await query(
        'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
        [`${name}'s Workspace`]
      );
      orgId = orgRes.rows[0].id;
      
      const insertUserRes = await query(
        `INSERT INTO users (name, email, password_hash, organization_id, role) 
         VALUES ($1, $2, $3, $4, 'Admin') RETURNING id, name, email, role`,
        [name, normalizedEmail, 'google_oauth_managed', orgId]
      );
      user = insertUserRes.rows[0];

      await query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'Admin')`,
        [orgId, user.id]
      );
      await query('COMMIT');
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
      JWT_SECRET,
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
    if (error.message.includes('BEGIN') || error.message.includes('COMMIT')) {
        await query('ROLLBACK');
    }
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
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log(`Password reset link generated for ${user.email}: /reset-password?token=${resetToken}`);
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
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters long');

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    if (!decoded.userId || decoded.type !== 'password_reset') {
      throw new ApiError(400, 'Invalid reset token payload');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const updateRes = await query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email', [passwordHash, decoded.userId]);
    if (updateRes.rows.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
