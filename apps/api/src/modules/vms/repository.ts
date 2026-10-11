import type { VmCreateInput, VmUpdateInput } from '@vm-manager/shared';
import type { PrismaClient } from '../../generated/prisma/client.ts';

export function createVmsRepository(prisma: PrismaClient) {
  return {
    list() {
      return prisma.vm.findMany({ orderBy: { createdAt: 'desc' } });
    },
    findById(id: string) {
      return prisma.vm.findUnique({ where: { id } });
    },
    create(data: VmCreateInput) {
      return prisma.vm.create({ data });
    },
    update(id: string, data: VmUpdateInput) {
      return prisma.vm.update({ where: { id }, data });
    },
    remove(id: string) {
      return prisma.vm.delete({ where: { id } });
    },
  };
}

export type VmsRepository = ReturnType<typeof createVmsRepository>;
