import { useEffect } from 'react';

const BASE_TITLE = 'VM Manager';

/** Mantiene el título del documento sincronizado con la página actual. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
  }, [title]);
}
