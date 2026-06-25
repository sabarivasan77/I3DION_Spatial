import { create } from 'zustand';
import { api, ApiClientError, type SessionUser } from '../services/api';

const TOKEN_KEY = 'i3dion.accessToken';
const USER_KEY = 'i3dion.user';
const OFFLINE_TOKEN = 'offline-dev-token';

function createOfflineSession(payload: { name: string; email: string; companyName?: string }): {
  token: string;
  user: SessionUser;
} {
  return {
    token: OFFLINE_TOKEN,
    user: {
      id: `offline-${payload.email}`,
      companyId: 'offline-company',
      name: payload.name,
      email: payload.email,
      role: 'Admin',
    },
  };
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function readUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: readUser(),
  loading: false,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const session = await api.login(email, password);
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      set({ token: session.token, user: session.user, loading: false });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 0) {
        const session = createOfflineSession({
          name: email.split('@')[0] || 'I3DION Admin',
          email,
        });
        localStorage.setItem(TOKEN_KEY, session.token);
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        set({ token: session.token, user: session.user, loading: false, error: null });
        return;
      }
      set({ error: error instanceof ApiClientError ? error.message : 'Unable to sign in', loading: false });
      throw error;
    }
  },
  signup: async (payload) => {
    set({ loading: true, error: null });
    try {
      const session = await api.signup(payload);
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      set({ token: session.token, user: session.user, loading: false });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 0) {
        const session = createOfflineSession({
          name: payload.name,
          email: payload.email,
          companyName: payload.companyName,
        });
        localStorage.setItem(TOKEN_KEY, session.token);
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        set({ token: session.token, user: session.user, loading: false, error: null });
        return;
      }
      set({
        error: error instanceof ApiClientError ? error.message : 'Unable to create account',
        loading: false,
      });
      throw error;
    }
  },
  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && token !== OFFLINE_TOKEN) {
      await api.logout(token).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, error: null });
  },
  clearError: () => set({ error: null }),
}));
