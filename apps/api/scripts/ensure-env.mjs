// Crea apps/api/.env desde apps/api/.env.example si no existe.
// Solo desarrollo: el flujo de la prueba funciona sin .env (hay valores por defecto).
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(apiRoot, '.env');
const examplePath = join(apiRoot, '.env.example');

if (!existsSync(envPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log('[setup] apps/api/.env creado desde .env.example');
}
