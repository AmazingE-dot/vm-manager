import type { AddressInfo } from 'node:net';
import type { Vm } from '@vm-manager/shared';
import type { FastifyInstance } from 'fastify';
import { io as createClient, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, createUser, loginAs, resetDatabase, TEST_ADMIN } from './helpers.ts';

describe('realtime (socket.io)', () => {
  let app: FastifyInstance;
  let baseUrl: string;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await createUser(app, TEST_ADMIN);
    adminCookie = await loginAs(app, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  function connect(cookie?: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = createClient(baseUrl, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 3000,
        extraHeaders: cookie ? { cookie } : {},
      });
      socket.once('connect', () => {
        resolve(socket);
      });
      socket.once('connect_error', (error) => {
        reject(error);
      });
    });
  }

  function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => {
      socket.once(event, (payload: T) => {
        resolve(payload);
      });
    });
  }

  it('rechaza la conexión sin cookie o con un token inválido', async () => {
    await expect(connect()).rejects.toThrow('UNAUTHORIZED');
    await expect(connect('token=inventado')).rejects.toThrow('UNAUTHORIZED');
  });

  it('emite vm:created, vm:updated y vm:deleted tras confirmar la escritura', async () => {
    const socket = await connect(adminCookie);

    try {
      const createdPromise = waitForEvent<Vm>(socket, 'vm:created');
      const created = await app.inject({
        method: 'POST',
        url: '/vms',
        headers: { cookie: adminCookie },
        payload: { name: 'realtime-01', cores: 2, ram: 2, disk: 20, os: 'UBUNTU' },
      });
      expect(created.statusCode).toBe(201);
      const createdVm = await createdPromise;
      expect(createdVm.name).toBe('realtime-01');
      expect(createdVm.status).toBe('STOPPED');

      const updatedPromise = waitForEvent<Vm>(socket, 'vm:updated');
      const updated = await app.inject({
        method: 'PUT',
        url: `/vms/${createdVm.id}`,
        headers: { cookie: adminCookie },
        payload: { status: 'RUNNING' },
      });
      expect(updated.statusCode).toBe(200);
      const updatedVm = await updatedPromise;
      expect(updatedVm.status).toBe('RUNNING');

      const deletedPromise = waitForEvent<Vm>(socket, 'vm:deleted');
      const removed = await app.inject({
        method: 'DELETE',
        url: `/vms/${createdVm.id}`,
        headers: { cookie: adminCookie },
      });
      expect(removed.statusCode).toBe(204);
      const deletedVm = await deletedPromise;
      expect(deletedVm.id).toBe(createdVm.id);
    } finally {
      socket.disconnect();
    }
  });
});
