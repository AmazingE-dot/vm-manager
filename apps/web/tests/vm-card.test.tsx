import type { Vm } from '@vm-manager/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../src/features/auth/authStore';
import { useRecentChangesStore } from '../src/features/realtime/recentChanges';
import { VmCard } from '../src/features/vms/components/VmCard';

const vm: Vm = {
  id: '9f8c6f5e-1f2b-4a3c-9d4e-5f6a7b8c9d0e',
  name: 'web-01',
  cores: 2,
  ram: 4,
  disk: 20,
  os: 'UBUNTU',
  status: 'RUNNING',
  createdAt: '2026-10-10T12:00:00.000Z',
  updatedAt: '2026-10-10T12:00:00.000Z',
};

function renderCard() {
  return render(
    <MemoryRouter>
      <VmCard vm={vm} onToggleStatus={vi.fn()} onDelete={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('VmCard según rol', () => {
  beforeEach(() => {
    useRecentChangesStore.setState({ ids: new Set() });
  });

  it('un CLIENT no ve editar, eliminar ni el toggle de estado', () => {
    useAuthStore.setState({
      user: { id: 'u-2', email: 'client@test.local', name: 'Client', role: 'CLIENT' },
      status: 'authenticated',
    });

    renderCard();

    expect(screen.getByText('web-01')).toBeInTheDocument();
    expect(screen.queryByLabelText('Editar web-01')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Eliminar web-01')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('un ADMIN ve las acciones y el estado', () => {
    useAuthStore.setState({
      user: { id: 'u-1', email: 'admin@test.local', name: 'Admin', role: 'ADMIN' },
      status: 'authenticated',
    });

    renderCard();

    expect(screen.getByLabelText('Editar web-01')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar web-01')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('aplica el resaltado solo cuando su id está marcado como reciente', () => {
    useAuthStore.setState({
      user: { id: 'u-1', email: 'admin@test.local', name: 'Admin', role: 'ADMIN' },
      status: 'authenticated',
    });

    const { container: withoutRecent } = renderCard();
    expect(withoutRecent.querySelector('.vm-changed')).toBeNull();

    useRecentChangesStore.setState({ ids: new Set([vm.id]) });
    const { container: withRecent } = renderCard();
    expect(withRecent.querySelector('.vm-changed')).not.toBeNull();
  });
});
