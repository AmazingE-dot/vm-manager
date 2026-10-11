import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Los tests corren contra el código fuente de shared (sin exigir su build).
      '@vm-manager/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    // Los tests comparten la misma base de datos: se ejecutan archivo por archivo.
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/test-env.ts'],
    include: ['tests/**/*.test.ts'],
  },
});
