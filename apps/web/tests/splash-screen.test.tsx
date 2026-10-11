import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SplashScreen } from '../src/components/SplashScreen';

describe('SplashScreen', () => {
  it('renderiza con role="status" y aria-label "Cargando"', () => {
    render(<SplashScreen />);

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  it('apila las dos capas del logo (gris y color) para cada tema', () => {
    const { container } = render(<SplashScreen />);

    expect(container.querySelectorAll('img')).toHaveLength(4);
    expect(container.querySelectorAll('.splash-base')).toHaveLength(2);
    expect(container.querySelectorAll('.splash-fill')).toHaveLength(2);
  });

  it('permanece invisible durante el retraso anti-parpadeo pero presente para accesibilidad', () => {
    render(<SplashScreen visible={false} />);

    const status = screen.getByRole('status', { name: 'Cargando' });
    expect(status).toHaveClass('opacity-0');
    expect(status.querySelectorAll('.splash-fill')).toHaveLength(0);
  });
});
