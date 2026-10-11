import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VmFormModal } from '../src/features/vms/VmFormModal';
import { useVms } from '../src/features/vms/hooks/useVms';

vi.mock('../src/features/vms/hooks/useVms', () => ({
  useVms: vi.fn(),
}));

const mockedUseVms = vi.mocked(useVms);

function renderModal() {
  mockedUseVms.mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useVms>);

  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/vms/new']}>
        <Routes>
          <Route path="/vms/new" element={<VmFormModal />} />
          <Route path="/vms" element={<div>Listado de VMs</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('VmFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('se abre como modal con el botón de crear deshabilitado hasta ser válido', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nueva VM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear VM' })).toBeDisabled();
  });

  it('muestra el mensaje en español al vaciar un campo numérico', async () => {
    renderModal();

    const cores = screen.getByLabelText('vCPU');
    fireEvent.change(cores, { target: { value: '4' } });
    fireEvent.change(cores, { target: { value: '' } });

    expect(await screen.findByText('Introduce un número')).toBeInTheDocument();
  });

  it('cierra con Cancelar y vuelve al listado', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('Listado de VMs')).toBeInTheDocument();
  });
});
