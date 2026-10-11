import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { env } from './config/env.ts';
import { AppError, ERROR_CODES } from './lib/errors.ts';
import { createPrismaClient } from './lib/prisma.ts';
import { requireJsonContentType } from './middleware/requireJsonContentType.ts';
import authRoutes from './modules/auth/routes.ts';
import vmsRoutes from './modules/vms/routes.ts';
import { registerCookie } from './plugins/cookie.ts';
import { registerCors } from './plugins/cors.ts';
import { registerHelmet } from './plugins/helmet.ts';
import { registerJwt } from './plugins/jwt.ts';
import { registerRateLimit } from './plugins/rateLimit.ts';

const BODY_LIMIT_BYTES = 64 * 1024;
const DEFAULT_LOGIN_RATE_LIMIT_MAX = 5;

export interface BuildAppOptions {
  logger?: boolean;
  loginRateLimitMax?: number;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      options.logger ??
      ({
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: {
          paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
          censor: '[REDACTED]',
        },
      } satisfies FastifyServerOptions['logger']),
    bodyLimit: BODY_LIMIT_BYTES,
  });

  app.decorate('prisma', createPrismaClient(env.DATABASE_URL));

  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });

  await registerCookie(app);
  await registerJwt(app);
  await registerCors(app);
  await registerHelmet(app);
  await registerRateLimit(app);

  app.addHook('preValidation', requireJsonContentType);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }

    if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
      return reply.status(415).send({
        error: {
          code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
          message: 'El Content-Type debe ser application/json',
        },
      });
    }

    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.status(413).send({
        error: {
          code: ERROR_CODES.PAYLOAD_TOO_LARGE,
          message: 'El cuerpo de la petición es demasiado grande',
        },
      });
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        error: {
          code: ERROR_CODES.BAD_REQUEST,
          message: 'Petición inválida',
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error interno del servidor',
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: `Ruta no encontrada: ${request.method} ${request.url}`,
      },
    });
  });

  await app.register(authRoutes, {
    loginRateLimitMax: options.loginRateLimitMax ?? DEFAULT_LOGIN_RATE_LIMIT_MAX,
  });
  await app.register(vmsRoutes);

  return app;
}
