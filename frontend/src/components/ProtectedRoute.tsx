import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && token !== 'offline-dev-token') {
      api.getMe(token).catch((err) => {
        if (err.status === 401) {
          logout();
        }
      });
    }
  }, [token, logout]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
