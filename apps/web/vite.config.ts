import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Vite 8 usa Rolldown: la forma vigente de separar chunks es `codeSplitting.groups`.
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 30_000,
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/]recharts[\\/]/,
              priority: 30,
              includeDependenciesRecursively: true,
              minSize: 60_000,
              maxSize: 450_000,
            },
            {
              name: 'vendor-socket',
              test: /node_modules[\\/]socket\.io-client[\\/]/,
              priority: 30,
              includeDependenciesRecursively: true,
              maxSize: 450_000,
            },
            {
              name: 'vendor-forms',
              test: /node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              priority: 20,
              includeDependenciesRecursively: true,
            },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](sonner|lucide-react|zustand|@tanstack[\\/]react-query)[\\/]/,
              priority: 15,
              includeDependenciesRecursively: true,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 5,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      // El front consume la API vía /api (mismo origen: la cookie SameSite=Strict funciona sin CORS).
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // socket.io (Fase 6) también pasa por el proxy, incluido el upgrade a WebSocket.
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
