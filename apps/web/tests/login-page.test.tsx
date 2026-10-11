import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../src/features/auth/authStore';
import { LoginPage } from '../src/features/auth/LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
  });

  it('usa el nombre de marca IFX VM Manager en el logo y el título', () => {
    renderLogin();

    expect(screen.getAllByAltText('IFX VM Manager')).toHaveLength(2);
    expect(document.title).toBe('Iniciar sesión · IFX VM Manager');
  });

  it('mantiene el botón deshabilitado hasta que el formulario es válido', async () => {
    renderLogin();
    const submit = screen.getByRole('button', { name: 'Iniciar sesión' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@ifx.test' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Admin123!' },
    });

    // La validación del resolver es asíncrona: el botón se habilita en el siguiente tick.
    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
  });

  it('muestra el error de validación del email', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'no-es-email' },
    });

    expect(await screen.findByText('El email no es válido')).toBeInTheDocument();
  });
});
