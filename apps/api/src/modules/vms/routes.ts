import type { FastifyInstance } from 'fastify';
import { parseOrThrow } from '../../lib/errors.ts';
import { authenticate } from '../../middleware/authenticate.ts';
import { requireRole } from '../../middleware/requireRole.ts';
import { createVmsRepository } from './repository.ts';
import { uuidSchema, vmCreateSchema, vmUpdateSchema } from './schemas.ts';
import { createVmsService } from './service.ts';

// Plugin de Fastify: la firma async es la forma canónica de registro.
// eslint-disable-next-line @typescript-eslint/require-await -- plugin async de Fastify
export default async function vmsRoutes(app: FastifyInstance): Promise<void> {
  const service = createVmsService(createVmsRepository(app.prisma), app.vmEvents);

  app.get('/vms', { preHandler: [authenticate] }, async () => {
    const vms = await service.list();
    return { vms };
  });

  app.post('/vms', { preHandler: [authenticate, requireRole('ADMIN')] }, async (request, reply) => {
    const input = parseOrThrow(vmCreateSchema, request.body);
    const vm = await service.create(input);
    return reply.code(201).send({ vm });
  });

  app.put('/vms/:id', { preHandler: [authenticate, requireRole('ADMIN')] }, async (request) => {
    const params = request.params as { id: unknown };
    const id = parseOrThrow(uuidSchema, params.id);
    const input = parseOrThrow(vmUpdateSchema, request.body);
    const vm = await service.update(id, input);
    return { vm };
  });

  app.delete(
    '/vms/:id',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    async (request, reply) => {
      const params = request.params as { id: unknown };
      const id = parseOrThrow(uuidSchema, params.id);
      await service.remove(id);
      return reply.code(204).send();
    },
  );
}
