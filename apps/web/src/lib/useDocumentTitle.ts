import { useEffect } from 'react';

const BASE_TITLE = 'VM Manager';

/**
 * Mantiene el título del documento sincronizado con la página actual y lo
 * restaura al desmontar (por ejemplo, al cerrar un modal sobre el listado).
 */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
