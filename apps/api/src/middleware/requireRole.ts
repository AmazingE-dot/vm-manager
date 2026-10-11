import type { Role } from '@vm-manager/shared';
import type { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../lib/errors.ts';

/** Debe usarse después de `authenticate`: exige el rol indicado. */
export function requireRole(role: Role) {
  // async requerido por Fastify v5 (ver requireJsonContentType).
  // eslint-disable-next-line @typescript-eslint/require-await -- Fastify v5 exige que el hook devuelva una promesa
  return async function requireRoleGuard(request: FastifyRequest): Promise<void> {
    if (request.user.role !== role) {
      throw new ForbiddenError();
    }
  };
}
