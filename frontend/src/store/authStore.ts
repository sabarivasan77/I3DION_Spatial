import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { SessionUser } from '../services/api';

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const mapSupabaseUser = (user: any): SessionUser => {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    companyId: user.user_metadata?.companyId || 'default-company',
    role: user.user_metadata?.role || 'Company Admin',
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,
  initialized: false,
  
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        set({ token: session.access_token, user: mapSupabaseUser(session.user), initialized: true });
      } else {
        set({ token: null, user: null, initialized: true });
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({ token: session.access_token, user: mapSupabaseUser(session.user) });
      } else {
        set({ token: null, user: null });
      }
    });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ loading: false });
  },
  
  loginGoogle: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    // Note: OAuth redirects, so loading state stays true until redirect
  },
  
  signup: async (payload) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
          companyName: payload.companyName,
          role: 'Company Admin',
        }
      }
    });
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ loading: false });
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ token: null, user: null, error: null });
  },
  
  clearError: () => set({ error: null }),
}));
