import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTestApp,
  createUser,
  loginAs,
  resetDatabase,
  TEST_ADMIN,
  TEST_CLIENT,
  type ErrorBody,
  type VmBody,
  type VmsBody,
} from './helpers.ts';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

function request(
  app: FastifyInstance,
  method: Method,
  url: string,
  cookie: string,
  payload?: Record<string, unknown>,
) {
  return app.inject({ method, url, headers: { cookie }, ...(payload ? { payload } : {}) });
}

describe('vms', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await createUser(app, TEST_ADMIN);
    await createUser(app, TEST_CLIENT);
    adminCookie = await loginAs(app, TEST_ADMIN.email, TEST_ADMIN.password);
    clientCookie = await loginAs(app, TEST_CLIENT.email, TEST_CLIENT.password);
  });

  it('GET /vms sin sesión → 401', async () => {
    const response = await app.inject({ method: 'GET', url: '/vms' });
    expect(response.statusCode).toBe(401);
    expect(response.json<ErrorBody>().error.code).toBe('UNAUTHORIZED');
  });

  it('CLIENT puede listar (200)', async () => {
    const response = await request(app, 'GET', '/vms', clientCookie);
    expect(response.statusCode).toBe(200);
    expect(response.json<VmsBody>()).toEqual({ vms: [] });
  });

  it('ADMIN crea una VM con status STOPPED por defecto', async () => {
    const response = await request(app, 'POST', '/vms', adminCookie, {
      name: 'web-01',
      cores: 2,
      ram: 4,
      disk: 20,
      os: 'UBUNTU',
    });

    expect(response.statusCode).toBe(201);
    const { vm } = response.json<VmBody>();
    expect(vm).toMatchObject({
      name: 'web-01',
      cores: 2,
      ram: 4,
      disk: 20,
      os: 'UBUNTU',
      status: 'STOPPED',
    });
    expect(vm.id).toBeTypeOf('string');

    const list = await request(app, 'GET', '/vms', clientCookie);
    expect(list.json<VmsBody>().vms).toHaveLength(1);
  });

  it('nombre duplicado → 409 CONFLICT', async () => {
    const payload = { name: 'dup-01', cores: 1, ram: 1, disk: 10, os: 'DEBIAN' };
    await request(app, 'POST', '/vms', adminCookie, payload);
    const response = await request(app, 'POST', '/vms', adminCookie, payload);

    expect(response.statusCode).toBe(409);
    expect(response.json<ErrorBody>().error.code).toBe('CONFLICT');
  });

  it('validación zod → 400 con details', async () => {
    const response = await request(app, 'POST', '/vms', adminCookie, {
      name: 'MAYUSCULAS',
      cores: 0,
      ram: 999,
      disk: 5,
      os: 'MACOS',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<ErrorBody>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details?.length).toBeGreaterThan(0);
  });

  it('rechaza campos desconocidos al crear una VM (esquemas estrictos)', async () => {
    const response = await request(app, 'POST', '/vms', adminCookie, {
      name: 'estricta-01',
      cores: 1,
      ram: 1,
      disk: 10,
      os: 'UBUNTU',
      hack: true,
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<ErrorBody>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(
      body.error.details?.some((detail) => detail.message.includes('campos no permitidos')),
    ).toBe(true);
  });

  it('CLIENT no puede crear, editar ni eliminar (403) y nada cambia', async () => {
    const create = await request(app, 'POST', '/vms', clientCookie, {
      name: 'no-permitida',
      cores: 1,
      ram: 1,
      disk: 10,
      os: 'UBUNTU',
    });
    expect(create.statusCode).toBe(403);
    expect(create.json<ErrorBody>().error.code).toBe('FORBIDDEN');

    const created = await request(app, 'POST', '/vms', adminCookie, {
      name: 'objetivo-01',
      cores: 1,
      ram: 1,
      disk: 10,
      os: 'UBUNTU',
    });
    const { vm } = created.json<VmBody>();

    const update = await request(app, 'PUT', `/vms/${vm.id}`, clientCookie, {
      status: 'RUNNING',
    });
    expect(update.statusCode).toBe(403);

    const remove = await request(app, 'DELETE', `/vms/${vm.id}`, clientCookie);
    expect(remove.statusCode).toBe(403);

    const list = await request(app, 'GET', '/vms', adminCookie);
    const vms = list.json<VmsBody>().vms;
    expect(vms).toHaveLength(1);
    expect(vms[0]?.status).toBe('STOPPED');
  });

  it('ADMIN actualiza parcialmente y elimina', async () => {
    const created = await request(app, 'POST', '/vms', adminCookie, {
      name: 'editable-01',
      cores: 4,
      ram: 8,
      disk: 80,
      os: 'CENTOS',
    });
    const { vm } = created.json<VmBody>();

    const updated = await request(app, 'PUT', `/vms/${vm.id}`, adminCookie, {
      status: 'RUNNING',
      cores: 8,
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json<VmBody>().vm).toMatchObject({ cores: 8, status: 'RUNNING', ram: 8 });

    const removed = await request(app, 'DELETE', `/vms/${vm.id}`, adminCookie);
    expect(removed.statusCode).toBe(204);

    const list = await request(app, 'GET', '/vms', adminCookie);
    expect(list.json<VmsBody>().vms).toHaveLength(0);
  });

  it('404 en VM inexistente, 400 en id inválido y 404 uniforme en rutas desconocidas', async () => {
    const missing = await request(
      app,
      'PUT',
      '/vms/00000000-0000-4000-8000-000000000000',
      adminCookie,
      { cores: 2 },
    );
    expect(missing.statusCode).toBe(404);

    const badId = await request(app, 'DELETE', '/vms/no-es-uuid', adminCookie);
    expect(badId.statusCode).toBe(400);

    const unknownRoute = await app.inject({
      method: 'GET',
      url: '/no-existe',
      headers: { cookie: adminCookie },
    });
    expect(unknownRoute.statusCode).toBe(404);
    expect(unknownRoute.json<ErrorBody>().error.code).toBe('NOT_FOUND');
  });
});
