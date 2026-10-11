import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { AppError, ERROR_CODES } from '../lib/errors.ts';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    // Solo las rutas que lo piden (por ejemplo /login) quedan limitadas.
    global: false,
    // El plugin lanza este error y el errorHandler lo formatea uniforme.
    errorResponseBuilder: () =>
      new AppError(
        429,
        ERROR_CODES.RATE_LIMITED,
        'Demasiados intentos. Inténtalo de nuevo más tarde.',
      ),
  });
}
