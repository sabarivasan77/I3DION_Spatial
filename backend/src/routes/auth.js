import { Router } from 'express';

export const authRouter = Router();

// Authentication is now handled directly by Supabase on the frontend.
// The backend only verifies the Supabase JWT tokens via middleware.

