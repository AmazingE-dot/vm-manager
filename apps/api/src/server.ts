import { buildApp } from './app.ts';
import { env } from './config/env.ts';

const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: '127.0.0.1' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().finally(() => process.exit(0));
  });
}
