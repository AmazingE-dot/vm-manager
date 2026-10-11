import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // El front consume la API vía /api (mismo origen: la cookie SameSite=Strict funciona sin CORS).
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Preparado para la Fase 6 (realtime).
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
