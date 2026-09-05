import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';

const roleRank = {
  Viewer: 1,
  'Sales User': 2,
  Manager: 3,
  Admin: 4,
  'Company Admin': 4,
};

// Initialize Supabase client with fallbacks to prevent server crash on startup
const supabaseUrl = config.supabaseUrl || 'https://xyzcompany.supabase.co';
const supabaseKey = config.supabaseKey || 'public-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    // Verify user exists and token is valid via Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError(401, 'Invalid or expired session');
    }

    // Map Supabase user object back to our expected shape
    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      company_id: user.user_metadata?.companyId || 'default-company',
      role: user.user_metadata?.role || 'Company Admin',
    };
    req.token = token;
    
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const allowed = roles.some((role) => (roleRank[req.user.role] || 0) >= (roleRank[role] || 0));
    if (!allowed) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
}
