import { loadEnvFile } from 'node:process';
import { z } from 'zod';

// Carga apps/api/.env si existe; las variables ya definidas tienen prioridad.
try {
  loadEnvFile();
} catch {
  // Sin .env: aplican los valores por defecto de desarrollo.
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1).default('postgresql://vmuser:vmpass@localhost:5433/vmdb'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
    .default('dev-secret-solo-para-desarrollo-no-usar-en-produccion'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'Formato esperado: 30s, 15m, 1h o 7d')
    .default('1h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('strict'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[config] Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

// En producción, la URL de la base y el secreto son obligatorios (sin defaults).
if (env.NODE_ENV === 'production') {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[config] En producción son obligatorias: ${missing.join(', ')}`);
    process.exit(1);
  }
}
