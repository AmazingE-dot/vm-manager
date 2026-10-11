import { defineConfig, env } from 'prisma/config';

// Prisma 7 ya no carga .env automáticamente. Usamos la API nativa de Node
// (>= 20.12) y toleramos que no exista .env: en ese caso aplican los valores
// por defecto de desarrollo (sincronizados con src/config/env.ts).
try {
  process.loadEnvFile();
} catch {
  // Sin .env.
}

process.env.DATABASE_URL ??= 'postgresql://vmuser:vmpass@localhost:5433/vmdb';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
