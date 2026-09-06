import { create } from 'zustand';
import type { SessionUser } from '../services/api';
import { api } from '../services/api';

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('i3dion_token'),
  user: null,
  loading: false,
  error: null,
  initialized: false,
  
  initialize: async () => {
    const token = localStorage.getItem('i3dion_token');
    if (token) {
      try {
        // Here we could add a GET /api/v1/auth/me if we want to validate on startup
        // For now, assume token is valid and user object will be fetched by other components
        // Or decode JWT on frontend
        const userStr = localStorage.getItem('i3dion_user');
        if (userStr) {
          set({ token, user: JSON.parse(userStr), initialized: true });
        } else {
          set({ token: null, user: null, initialized: true });
        }
      } catch (err) {
        set({ token: null, user: null, initialized: true });
      }
    } else {
      set({ token: null, user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.login(email, password);
      const { token, user } = response;
      
      localStorage.setItem('i3dion_token', token);
      localStorage.setItem('i3dion_user', JSON.stringify(user));
      
      set({ token, user, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Login failed', loading: false });
      throw error;
    }
  },

  loginGoogle: async (idToken: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.loginGoogle(idToken);
      const { token, user } = response;
      
      localStorage.setItem('i3dion_token', token);
      localStorage.setItem('i3dion_user', JSON.stringify(user));
      
      set({ token, user, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Google Login failed', loading: false });
      throw error;
    }
  },
  
  signup: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await api.signup({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        companyName: payload.companyName,
      });
      
      const { token, user } = response;
      
      localStorage.setItem('i3dion_token', token);
      localStorage.setItem('i3dion_user', JSON.stringify(user));
      
      set({ token, user, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Signup failed', loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    localStorage.removeItem('i3dion_token');
    localStorage.removeItem('i3dion_user');
    set({ token: null, user: null, error: null });
  },
  
  clearError: () => set({ error: null }),
}));
