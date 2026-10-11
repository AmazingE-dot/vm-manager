import type { Vm, VmCreateInput, VmUpdateInput } from '@vm-manager/shared';
import { Prisma } from '../../generated/prisma/client.ts';
import type { Vm as PrismaVm } from '../../generated/prisma/client.ts';
import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type { VmEvents } from '../../realtime/socket.ts';
import type { VmsRepository } from './repository.ts';

/** Prisma devuelve `Date`; el evento viaja con las fechas en ISO como el resto de la API. */
function toVmPayload(vm: PrismaVm): Vm {
  return {
    id: vm.id,
    name: vm.name,
    cores: vm.cores,
    ram: vm.ram,
    disk: vm.disk,
    os: vm.os,
    status: vm.status,
    createdAt: vm.createdAt.toISOString(),
    updatedAt: vm.updatedAt.toISOString(),
  };
}

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

export function createVmsService(repository: VmsRepository, events: VmEvents) {
  return {
    list() {
      return repository.list();
    },

    async create(input: VmCreateInput) {
      try {
        const vm = await repository.create(input);
        events.emitVmCreated(toVmPayload(vm));
        return vm;
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
        const vm = await repository.update(id, input);
        events.emitVmUpdated(toVmPayload(vm));
        return vm;
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
      events.emitVmDeleted(toVmPayload(existing));
    },
  };
}
