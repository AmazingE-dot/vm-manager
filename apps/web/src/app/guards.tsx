import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { SplashScreen, useSplashVisibility } from '../components/SplashScreen';
import { useAuth } from '../features/auth/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  const isLoading = status === 'idle' || status === 'loading';
  const splash = useSplashVisibility(isLoading);

  if (isLoading || splash.visible) {
    return <SplashScreen visible={splash.visible} closing={splash.closing} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

/** Debe usarse dentro de `ProtectedRoute`: exige rol ADMIN. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}
