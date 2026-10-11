import type { Role } from '@vm-manager/shared';
import type { ReactNode } from 'react';
import { useAuth } from '../features/auth/useAuth';

export function useCan(role: Role): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

/** Renderiza sus hijos solo si el usuario tiene el rol indicado. */
export function Can({ role, children }: { role: Role; children: ReactNode }) {
  return useCan(role) ? children : null;
}
