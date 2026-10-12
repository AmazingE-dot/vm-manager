import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // El realtime mantiene el cache al día; no hace falta refetch al enfocar la ventana.
      refetchOnWindowFocus: false,
    },
  },
});
