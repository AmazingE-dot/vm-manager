import type { Vm } from '@vm-manager/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../src/features/dashboard/DashboardPage';
import { useVms } from '../src/features/vms/hooks/useVms';

vi.mock('../src/features/vms/hooks/useVms', () => ({
  useVms: vi.fn(),
}));

const mockedUseVms = vi.mocked(useVms);

function buildVm(overrides: Partial<Vm>): Vm {
  return {
    id: 'vm-1',
    name: 'vm',
    cores: 1,
    ram: 1,
    disk: 10,
    os: 'UBUNTU',
    status: 'STOPPED',
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  };
}

function mockQuery(vms: Vm[]) {
  mockedUseVms.mockReturnValue({
    data: vms,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useVms>);
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los totales de las VMs encendidas', () => {
    mockQuery([
      buildVm({ id: 'vm-1', name: 'web-01', status: 'RUNNING', cores: 4, ram: 8, disk: 80 }),
      buildVm({ id: 'vm-2', name: 'db-01', status: 'RUNNING', cores: 2, ram: 2, disk: 20 }),
      buildVm({ id: 'vm-3', name: 'test-01', status: 'STOPPED', cores: 8, ram: 16, disk: 160 }),
    ]);

    renderDashboard();

    expect(screen.getByText('VMs encendidas')).toBeInTheDocument();
    expect(screen.getByText('de 3 en total')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('vCPU por VM')).toBeInTheDocument();
    expect(screen.getByText('RAM por VM')).toBeInTheDocument();
    expect(screen.getByText('Disco por VM')).toBeInTheDocument();
  });

  it('muestra el empty state cuando no hay VMs encendidas', () => {
    mockQuery([buildVm({ id: 'vm-1', name: 'test-01', status: 'STOPPED' })]);

    renderDashboard();

    expect(screen.getByText('No hay VMs encendidas')).toBeInTheDocument();
  });

  it('muestra el empty state cuando no hay VMs', () => {
    mockQuery([]);

    renderDashboard();

    expect(screen.getByText('Aún no hay máquinas virtuales')).toBeInTheDocument();
  });
});
