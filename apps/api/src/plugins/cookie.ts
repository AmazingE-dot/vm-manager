import cookie from '@fastify/cookie';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.ts';

const EXPIRES_IN_UNITS = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 } as const;

export function parseExpiresInToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 60 * 60;
  }
  const amount = Number(match[1] ?? 0);
  const unit = (match[2] ?? 'h') as keyof typeof EXPIRES_IN_UNITS;
  return amount * EXPIRES_IN_UNITS[unit];
}

/**
 * La cookie de sesión vive solo en el navegador: HttpOnly (el JS no la lee),
 * Secure y SameSite configurable por env (ver docs/DECISIONS.md).
 */
export function authCookieBaseOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: env.COOKIE_SAMESITE,
  } as const;
}

export function authCookieOptions() {
  return {
    ...authCookieBaseOptions(),
    maxAge: parseExpiresInToSeconds(env.JWT_EXPIRES_IN),
  };
}

export async function registerCookie(app: FastifyInstance): Promise<void> {
  await app.register(cookie);
}
