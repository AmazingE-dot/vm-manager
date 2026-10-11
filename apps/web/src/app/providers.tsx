import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useAuth } from '../features/auth/useAuth';
import { queryClient } from '../lib/queryClient';
import { useThemeStore } from './theme';

export function AppProviders({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const { restoreSession } = useAuth();

  // Restaura la sesión una sola vez al arrancar (GET /me).
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        theme={theme}
        toastOptions={{
          classNames: {
            toast: 'rounded-card border border-separator bg-surface text-text shadow-card',
            description: 'text-text-secondary',
            actionButton: 'bg-accent text-white',
            cancelButton: 'bg-surface-2 text-text',
          },
        }}
      />
    </QueryClientProvider>
  );
}
