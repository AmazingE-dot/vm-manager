import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AdminRoute, ProtectedRoute } from '../src/app/guards';
import { useAuthStore } from '../src/features/auth/authStore';

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route
          path="/privada"
          element={
            <ProtectedRoute>
              <div>Contenido privado</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>Inicio</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirige a /login cuando no hay sesión', () => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    renderProtected();
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('renderiza el contenido cuando hay sesión', () => {
    useAuthStore.setState({
      user: { id: 'u-1', email: 'admin@test.local', name: 'Admin', role: 'ADMIN' },
      status: 'authenticated',
    });
    renderProtected();
    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });

  it('muestra un indicador de carga mientras se restaura la sesión', () => {
    useAuthStore.setState({ user: null, status: 'loading' });
    renderProtected();
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('redirige a CLIENT fuera de las rutas de ADMIN', () => {
    useAuthStore.setState({
      user: { id: 'u-2', email: 'client@test.local', name: 'Client', role: 'CLIENT' },
      status: 'authenticated',
    });

    render(
      <MemoryRouter initialEntries={['/solo-admin']}>
        <Routes>
          <Route path="/" element={<div>Inicio</div>} />
          <Route
            path="/solo-admin"
            element={
              <AdminRoute>
                <div>Solo admin</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });
});
