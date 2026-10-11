import { loadEnvFile } from 'node:process';

// Igual que en src/config/env.ts: carga apps/api/.env si existe (sin sobreescribir
// variables ya definidas) para que los tests usen la misma configuración.
try {
  loadEnvFile();
} catch {
  // Sin .env: se usa el valor por defecto.
}

function deriveTestDatabaseUrl(base: string): string {
  const url = new URL(base);
  if (!url.pathname.endsWith('_test')) {
    url.pathname = `${url.pathname}_test`;
  }
  return url.toString();
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = deriveTestDatabaseUrl(
  process.env.DATABASE_URL ?? 'postgresql://vmuser:vmpass@localhost:5433/vmdb',
);

export const testDatabaseUrl = process.env.DATABASE_URL;
