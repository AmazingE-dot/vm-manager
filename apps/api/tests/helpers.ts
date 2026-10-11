import type { Role, Vm } from '@vm-manager/shared';
import { hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}

export interface LoginBody {
  user: PublicUser;
}

export interface MeBody {
  user: PublicUser;
}

export interface VmBody {
  vm: Vm;
}

export interface VmsBody {
  vms: Vm[];
}

export const TEST_ADMIN = {
  email: 'admin@test.local',
  password: 'Admin123!',
  name: 'Admin',
  role: 'ADMIN',
} as const;

export const TEST_CLIENT = {
  email: 'client@test.local',
  password: 'Client123!',
  name: 'Client',
  role: 'CLIENT',
} as const;

export function buildTestApp(
  options: { loginRateLimitMax?: number } = {},
): Promise<FastifyInstance> {
  return buildApp({ logger: false, loginRateLimitMax: options.loginRateLimitMax ?? 1000 });
}

export async function resetDatabase(app: FastifyInstance): Promise<void> {
  await app.prisma.vm.deleteMany();
  await app.prisma.user.deleteMany();
}

export async function createUser(
  app: FastifyInstance,
  user: { email: string; password: string; name: string; role: Role },
): Promise<void> {
  await app.prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      role: user.role,
      // Coste bajo para que la suite sea rápida; en producción el seed usa 10.
      passwordHash: await hash(user.password, 4),
    },
  });
}

export async function loginAs(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/login',
    payload: { email, password },
  });

  if (response.statusCode !== 200) {
    throw new Error(`Login de prueba falló (${response.statusCode}): ${response.body}`);
  }

  const setCookie = response.headers['set-cookie'];
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!cookie) {
    throw new Error('El login de prueba no devolvió cookie');
  }

  return cookie.split(';')[0] ?? '';
}
