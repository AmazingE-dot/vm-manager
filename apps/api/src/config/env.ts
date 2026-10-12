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

/** Secretos de ejemplo (`.env.example`) o de desarrollo que no valen en producción. */
const FORBIDDEN_PRODUCTION_SECRETS = new Set([
  'dev-secret-solo-para-desarrollo-no-usar-en-produccion',
  'cambia-esto-por-un-secreto-largo-de-al-menos-32-caracteres',
]);

/** Longitud mínima exigida al JWT_SECRET en producción. */
export const PRODUCTION_SECRET_MIN_LENGTH = 48;

/**
 * Problemas de configuración que impiden arrancar en producción (función pura,
 * testeable sin matar el proceso).
 */
export function findProductionConfigErrors(
  config: { JWT_SECRET: string },
  rawEnv: Record<string, string | undefined>,
): string[] {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !rawEnv[key]);
  if (missing.length > 0) {
    return [`En producción son obligatorias: ${missing.join(', ')}`];
  }

  const errors: string[] = [];

  if (config.JWT_SECRET.length < PRODUCTION_SECRET_MIN_LENGTH) {
    errors.push(
      `JWT_SECRET debe tener al menos ${PRODUCTION_SECRET_MIN_LENGTH} caracteres en producción`,
    );
  }
  if (FORBIDDEN_PRODUCTION_SECRETS.has(config.JWT_SECRET)) {
    errors.push('JWT_SECRET no puede ser un valor de ejemplo o de desarrollo en producción');
  }

  return errors;
}

// En producción la base y el secreto son obligatorios, y el secreto debe ser
// propio y suficientemente largo (sin valores de ejemplo ni de desarrollo).
if (env.NODE_ENV === 'production') {
  const errors = findProductionConfigErrors(env, process.env);
  if (errors.length > 0) {
    for (const message of errors) {
      console.error(`[config] ${message}`);
    }
    process.exit(1);
  }
}
