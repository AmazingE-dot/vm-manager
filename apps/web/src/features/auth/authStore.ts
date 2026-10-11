import type { User } from '@vm-manager/shared';
import { create } from 'zustand';
import { setUnauthorizedHandler } from '../../lib/httpClient';

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: SessionStatus;
  setStatus: (status: SessionStatus) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user, status: 'authenticated' }),
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
}));

// Cualquier respuesta 401 limpia la sesión; los guards redirigen a /login.
setUnauthorizedHandler(() => {
  const { status } = useAuthStore.getState();
  if (status !== 'unauthenticated') {
    useAuthStore.getState().clearSession();
  }
});
