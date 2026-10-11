import { useCallback } from 'react';
import { authApi } from './api';
import { useAuthStore } from './authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedUser } = await authApi.login(email, password);
    useAuthStore.getState().setUser(loggedUser);
    return loggedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Aunque la API falle, la sesión local se cierra igual.
    }
    useAuthStore.getState().clearSession();
  }, []);

  const restoreSession = useCallback(async () => {
    if (useAuthStore.getState().status !== 'idle') {
      return;
    }
    useAuthStore.getState().setStatus('loading');
    try {
      const { user: sessionUser } = await authApi.me();
      useAuthStore.getState().setUser(sessionUser);
    } catch {
      useAuthStore.getState().clearSession();
    }
  }, []);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated' && user !== null,
    login,
    logout,
    restoreSession,
  };
}
