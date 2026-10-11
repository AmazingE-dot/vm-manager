import type { FastifyInstance } from 'fastify';
import { parseOrThrow, UnauthorizedError } from '../../lib/errors.ts';
import { authenticate } from '../../middleware/authenticate.ts';
import { authCookieBaseOptions, authCookieOptions } from '../../plugins/cookie.ts';
import { loginSchema } from './schemas.ts';
import { login, toPublicUser } from './service.ts';

export interface AuthRoutesOptions {
  loginRateLimitMax: number;
}

// Plugin de Fastify: la firma async es la forma canónica de registro.
// eslint-disable-next-line @typescript-eslint/require-await -- plugin async de Fastify
export default async function authRoutes(
  app: FastifyInstance,
  options: AuthRoutesOptions,
): Promise<void> {
  app.post(
    '/login',
    {
      config: {
        rateLimit: { max: options.loginRateLimitMax, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      const { email, password } = parseOrThrow(loginSchema, request.body);
      const user = await login(app.prisma, email, password);

      const token = app.jwt.sign({ sub: user.id, role: user.role });
      reply.setCookie('token', token, authCookieOptions());

      return { user: toPublicUser(user) };
    },
  );

  app.post('/logout', { preHandler: [authenticate] }, (_request, reply) => {
    reply.clearCookie('token', authCookieBaseOptions());
    return reply.code(204).send();
  });

  app.get('/me', { preHandler: [authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      throw new UnauthorizedError('Sesión inválida o expirada');
    }
    return { user: toPublicUser(user) };
  });
}
