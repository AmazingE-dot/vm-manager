import type { VmCreateInput, VmUpdateInput } from '@vm-manager/shared';
import { Prisma } from '../../generated/prisma/client.ts';
import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type { VmsRepository } from './repository.ts';

function mapWriteError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new ConflictError('Ya existe una VM con ese nombre');
    }
    if (error.code === 'P2025') {
      return new NotFoundError('La VM no existe');
    }
  }
  return error;
}

export function createVmsService(repository: VmsRepository) {
  return {
    list() {
      return repository.list();
    },

    async create(input: VmCreateInput) {
      try {
        return await repository.create(input);
      } catch (error) {
        throw mapWriteError(error);
      }
    },

    async update(id: string, input: VmUpdateInput) {
      const existing = await repository.findById(id);
      if (!existing) {
        throw new NotFoundError('La VM no existe');
      }

      try {
        return await repository.update(id, input);
      } catch (error) {
        throw mapWriteError(error);
      }
    },

    async remove(id: string) {
      const existing = await repository.findById(id);
      if (!existing) {
        throw new NotFoundError('La VM no existe');
      }
      await repository.remove(id);
    },
  };
}
