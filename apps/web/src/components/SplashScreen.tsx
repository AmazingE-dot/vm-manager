import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

/** Retraso antes de mostrar el splash (evita parpadeos en cargas rápidas). */
export const SPLASH_SHOW_DELAY_MS = 300;
/** Tiempo mínimo visible una vez mostrado (cubre la animación de relleno). */
export const SPLASH_MIN_VISIBLE_MS = 1300;
/** Duración del fade de salida. */
export const SPLASH_FADE_MS = 200;

export interface SplashVisibility {
  visible: boolean;
  closing: boolean;
}

/**
 * Lógica anti-parpadeo del splash:
 * - Si la sesión se resuelve antes del retraso, el splash nunca se muestra.
 * - Si se muestra, permanece al menos hasta completar la animación y sale con un fade.
 */
export function useSplashVisibility(isLoading: boolean): SplashVisibility {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const timer = window.setTimeout(() => {
      visibleSinceRef.current = Date.now();
      setVisible(true);
    }, SPLASH_SHOW_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || !visible) {
      return;
    }

    const shownFor =
      visibleSinceRef.current === null
        ? SPLASH_MIN_VISIBLE_MS
        : Date.now() - visibleSinceRef.current;
    const wait = Math.max(SPLASH_MIN_VISIBLE_MS - shownFor, 0);

    const toFade = window.setTimeout(() => {
      setClosing(true);
    }, wait);
    const toHide = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, wait + SPLASH_FADE_MS);

    return () => {
      window.clearTimeout(toFade);
      window.clearTimeout(toHide);
    };
  }, [isLoading, visible]);

  return { visible, closing };
}

interface SplashScreenProps {
  /** `false` mientras corre el retraso anti-parpadeo (el contenedor existe pero invisible). */
  visible?: boolean;
  /** Inicia el fade de salida. */
  closing?: boolean;
}

/**
 * Splash de marca: el logo IFX se "llena" de color de izquierda a derecha.
 * Dos capas apiladas: base en gris tenue y superior a color revelada con `clip-path`.
 */
export function SplashScreen({ visible = true, closing = false }: SplashScreenProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-bg transition-opacity duration-200',
        visible && !closing ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="relative w-[200px] max-w-[60vw]">
        {/* Capa base: logo en gris, opacidad baja (única excepción a la regla de no filtrar el logo). */}
        <img
          src="/brand/ifx-logo.webp"
          alt=""
          aria-hidden="true"
          width={1833}
          height={816}
          className="splash-base w-full dark:hidden"
        />
        <img
          src="/brand/ifx-logo-dark.webp"
          alt=""
          aria-hidden="true"
          width={1833}
          height={816}
          className="splash-base hidden w-full dark:block"
        />
        {/* Capa superior: el mismo logo a color, revelado con clip-path. */}
        <div className="absolute inset-0">
          <img
            src="/brand/ifx-logo.webp"
            alt=""
            aria-hidden="true"
            width={1833}
            height={816}
            className={cn('w-full dark:hidden', visible && 'splash-fill')}
          />
          <img
            src="/brand/ifx-logo-dark.webp"
            alt=""
            aria-hidden="true"
            width={1833}
            height={816}
            className={cn('hidden w-full dark:block', visible && 'splash-fill')}
          />
        </div>
      </div>
    </div>
  );
}
