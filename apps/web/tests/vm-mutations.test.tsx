import type { Vm, VmCreateInput } from '@vm-manager/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vmsApi } from '../src/features/vms/api';
import { useVmMutations } from '../src/features/vms/hooks/useVmMutations';
import { vmsQueryKey } from '../src/features/vms/hooks/useVms';

vi.mock('../src/features/vms/api', () => ({
  vmsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const existingVm: Vm = {
  id: '9f8c6f5e-1f2b-4a3c-9d4e-5f6a7b8c9d0e',
  name: 'web-01',
  cores: 2,
  ram: 4,
  disk: 20,
  os: 'UBUNTU',
  status: 'STOPPED',
  createdAt: '2026-10-10T12:00:00.000Z',
  updatedAt: '2026-10-10T12:00:00.000Z',
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(vmsQueryKey, { vms: [existingVm] });
  return queryClient;
}

describe('useVmMutations (UI optimista)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revierte el alta optimista cuando la API falla', async () => {
    vi.mocked(vmsApi.create).mockRejectedValue(new Error('fallo de red'));
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useVmMutations(), { wrapper: createWrapper(queryClient) });

    const input: VmCreateInput = {
      name: 'nueva-01',
      cores: 1,
      ram: 1,
      disk: 10,
      os: 'DEBIAN',
      status: 'STOPPED',
    };

    await act(async () => {
      await result.current.createVm.mutateAsync(input).catch(() => undefined);
    });

    expect(queryClient.getQueryData(vmsQueryKey)).toEqual({ vms: [existingVm] });
  });

  it('revierte el borrado optimista cuando la API falla', async () => {
    vi.mocked(vmsApi.remove).mockRejectedValue(new Error('fallo de red'));
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useVmMutations(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.deleteVm.mutateAsync(existingVm).catch(() => undefined);
    });

    expect(queryClient.getQueryData(vmsQueryKey)).toEqual({ vms: [existingVm] });
  });

  it('mantiene el cambio optimista y lo reemplaza con la respuesta de la API', async () => {
    const created: Vm = {
      ...existingVm,
      id: 'b7f1c2d3-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
      name: 'nueva-01',
    };
    vi.mocked(vmsApi.create).mockResolvedValue({ vm: created });
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useVmMutations(), { wrapper: createWrapper(queryClient) });

    const input: VmCreateInput = {
      name: 'nueva-01',
      cores: 1,
      ram: 1,
      disk: 10,
      os: 'DEBIAN',
      status: 'STOPPED',
    };

    await act(async () => {
      await result.current.createVm.mutateAsync(input);
    });

    const data = queryClient.getQueryData<{ vms: Vm[] }>(vmsQueryKey);
    expect(data?.vms).toHaveLength(2);
    expect(data?.vms[0]).toEqual(created);
    expect(data?.vms.some((vm) => vm.id.startsWith('temp-'))).toBe(false);
  });
});
