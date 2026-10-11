import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { testDatabaseUrl } from './test-env.ts';

/** Aplica las migraciones en la base de datos de tests antes de la suite. */
export default function globalSetup(): void {
  const apiRoot = fileURLToPath(new URL('..', import.meta.url));
  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'inherit',
  });
}
