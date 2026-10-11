import type { Role } from '@vm-manager/shared';
import { compare } from 'bcryptjs';
import type { PrismaClient } from '../../generated/prisma/client.ts';
import { UnauthorizedError } from '../../lib/errors.ts';

// Hash de referencia (contraseña aleatoria) para gastar el mismo tiempo cuando
// el email no existe y no filtrar si un usuario está registrado.
const DUMMY_PASSWORD_HASH = '$2b$10$F9BrWZrEqmqkML.mRe9DBeXI7Kp.5Hv8H.LRKCYJcMvMhPjrUO59a';

export async function login(prisma: PrismaClient, email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  return user;
}

export function toPublicUser(user: { id: string; email: string; name: string; role: Role }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
