import type { Vm } from '@vm-manager/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecentChangesStore } from '../src/features/realtime/recentChanges';
import { useVmRealtime } from '../src/features/realtime/useVmRealtime';
import { vmsQueryKey } from '../src/features/vms/hooks/useVms';

const { handlers, fakeSocket } = vi.hoisted(() => {
  const handlers = new Map<string, (vm: Vm) => void>();
  const fakeSocket = {
    connected: true,
    on: (event: string, handler: (vm: Vm) => void) => {
      handlers.set(event, handler);
    },
    off: (event: string) => {
      handlers.delete(event);
    },
  };
  return { handlers, fakeSocket };
});

vi.mock('../src/features/realtime/socket', () => ({
  getSocket: () => fakeSocket,
  disconnectSocket: vi.fn(),
}));

function buildVm(overrides: Partial<Vm>): Vm {
  return {
    id: 'vm-1',
    name: 'vm',
    cores: 1,
    ram: 1,
    disk: 10,
    os: 'UBUNTU',
    status: 'STOPPED',
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
    ...overrides,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderRealtime(vms: Vm[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(vmsQueryKey, { vms });
  const view = renderHook(() => useVmRealtime(), { wrapper: createWrapper(queryClient) });
  return { queryClient, view };
}

describe('useVmRealtime', () => {
  beforeEach(() => {
    handlers.clear();
    useRecentChangesStore.setState({ ids: new Set() });
    vi.clearAllMocks();
  });

  it('inserta una VM creada por otra sesión y la marca como reciente', () => {
    const { queryClient } = renderRealtime([]);
    const incoming = buildVm({ id: 'vm-1', name: 'web-01' });

    act(() => {
      handlers.get('vm:created')?.(incoming);
    });

    const data = queryClient.getQueryData<{ vms: Vm[] }>(vmsQueryKey);
    expect(data?.vms).toHaveLength(1);
    expect(data?.vms[0]?.name).toBe('web-01');
    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(true);
  });

  it('aplica una actualización más nueva sin duplicar la VM', () => {
    const original = buildVm({ id: 'vm-1', status: 'STOPPED' });
    const { queryClient } = renderRealtime([original]);
    const incoming = {
      ...original,
      status: 'RUNNING' as const,
      updatedAt: '2026-10-11T10:05:00.000Z',
    };

    act(() => {
      handlers.get('vm:updated')?.(incoming);
    });

    const data = queryClient.getQueryData<{ vms: Vm[] }>(vmsQueryKey);
    expect(data?.vms).toHaveLength(1);
    expect(data?.vms[0]?.status).toBe('RUNNING');
    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(true);
  });

  it('ignora el eco del originador (mismo updatedAt) y no lo resalta', () => {
    const original = buildVm({ id: 'vm-1' });
    const { queryClient } = renderRealtime([original]);

    act(() => {
      handlers.get('vm:updated')?.(original);
    });

    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(false);
    expect(queryClient.getQueryData<{ vms: Vm[] }>(vmsQueryKey)?.vms).toHaveLength(1);
  });

  it('elimina del cache una VM borrada por otra sesión', () => {
    const original = buildVm({ id: 'vm-1' });
    const { queryClient } = renderRealtime([original]);

    act(() => {
      handlers.get('vm:deleted')?.(original);
    });

    expect(queryClient.getQueryData<{ vms: Vm[] }>(vmsQueryKey)?.vms).toHaveLength(0);
  });
});
