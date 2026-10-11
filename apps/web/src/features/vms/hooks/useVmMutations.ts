import type { Vm, VmCreateInput, VmUpdateInput } from '@vm-manager/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '../../../lib/httpClient';
import { vmsApi } from '../api';
import { vmsQueryKey, type VmsData } from './useVms';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ha ocurrido un error inesperado';
}

function createTempId(): string {
  return `temp-${crypto.randomUUID()}`;
}

/**
 * Mutaciones de VMs con UI optimista (onMutate + rollback en onError +
 * invalidación en onSettled), como pide AGENTS.md.
 */
export function useVmMutations() {
  const queryClient = useQueryClient();

  async function cancelAndSnapshot(): Promise<VmsData | undefined> {
    await queryClient.cancelQueries({ queryKey: vmsQueryKey });
    return queryClient.getQueryData<VmsData>(vmsQueryKey);
  }

  function restore(snapshot: VmsData | undefined): void {
    if (snapshot !== undefined) {
      queryClient.setQueryData<VmsData>(vmsQueryKey, snapshot);
    }
  }

  const createVm = useMutation({
    mutationFn: (input: VmCreateInput) => vmsApi.create(input),
    onMutate: async (input) => {
      const snapshot = await cancelAndSnapshot();
      const tempId = createTempId();
      const now = new Date().toISOString();
      const tempVm: Vm = { id: tempId, ...input, createdAt: now, updatedAt: now };

      queryClient.setQueryData<VmsData>(vmsQueryKey, (current) => ({
        vms: [tempVm, ...(current?.vms ?? [])],
      }));

      return { snapshot, tempId };
    },
    onSuccess: (data, _input, context) => {
      if (context) {
        queryClient.setQueryData<VmsData>(vmsQueryKey, (current) =>
          current
            ? {
                // Se descarta cualquier copia previa del id real (p. ej. si el
                // evento de socket llegó antes que la respuesta HTTP).
                vms: current.vms
                  .filter((vm) => vm.id !== data.vm.id)
                  .map((vm) => (vm.id === context.tempId ? data.vm : vm)),
              }
            : current,
        );
      }
      toast.success(`VM "${data.vm.name}" creada`);
    },
    onError: (error, _input, context) => {
      restore(context?.snapshot);
      toast.error(errorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: vmsQueryKey });
    },
  });

  const updateVm = useMutation({
    mutationFn: ({ id, input }: { id: string; input: VmUpdateInput }) => vmsApi.update(id, input),
    onMutate: async ({ id, input }) => {
      const snapshot = await cancelAndSnapshot();
      const now = new Date().toISOString();

      queryClient.setQueryData<VmsData>(vmsQueryKey, (current) =>
        current
          ? {
              vms: current.vms.map((vm) =>
                vm.id === id ? { ...vm, ...input, updatedAt: now } : vm,
              ),
            }
          : current,
      );

      return { snapshot };
    },
    onSuccess: (data, variables) => {
      const onlyStatus =
        Object.keys(variables.input).length === 1 && variables.input.status !== undefined;
      const suffix = onlyStatus
        ? data.vm.status === 'RUNNING'
          ? 'encendida'
          : 'apagada'
        : 'actualizada';
      toast.success(`VM "${data.vm.name}" ${suffix}`);
    },
    onError: (error, _variables, context) => {
      restore(context?.snapshot);
      toast.error(errorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: vmsQueryKey });
    },
  });

  const deleteVm = useMutation({
    mutationFn: (vm: Vm) => vmsApi.remove(vm.id),
    onMutate: async (vm) => {
      const snapshot = await cancelAndSnapshot();

      queryClient.setQueryData<VmsData>(vmsQueryKey, (current) =>
        current ? { vms: current.vms.filter((item) => item.id !== vm.id) } : current,
      );

      return { snapshot };
    },
    onSuccess: (_data, vm) => {
      toast.success(`VM "${vm.name}" eliminada`);
    },
    onError: (error, _vm, context) => {
      restore(context?.snapshot);
      toast.error(errorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: vmsQueryKey });
    },
  });

  return { createVm, updateVm, deleteVm };
}
