import jwt from '@fastify/jwt';
import type { Role } from '@vm-manager/shared';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.ts';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role };
    user: { sub: string; role: Role };
  }
}

export async function registerJwt(app: FastifyInstance): Promise<void> {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: { cookieName: 'token', signed: false },
  });
}
