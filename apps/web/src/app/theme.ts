import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function readCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

/**
 * El tema inicial lo aplica el script inline de index.html (sin parpadeo);
 * aquí solo se refleja y se persiste la preferencia.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  theme: readCurrentTheme(),
  toggle: () => {
    const next: Theme = readCurrentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sin localStorage la preferencia no persiste; el tema actual sigue aplicado.
    }
    set({ theme: next });
  },
}));
