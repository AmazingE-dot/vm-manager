import type { FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../lib/errors.ts';

/** Verifica el JWT de la cookie y expone `request.user` (sub + role). */
export async function authenticate(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Sesión inválida o expirada');
  }
}
