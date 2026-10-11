import { create } from 'zustand';

/** Duración del resaltado sutil tras un cambio remoto (~1.5 s). */
export const RECENT_CHANGE_MS = 1500;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

interface RecentChangesState {
  ids: ReadonlySet<string>;
  mark: (id: string) => void;
}

/** Ids de VMs "cambiadas recientemente" para disparar el pulso en la tarjeta. */
export const useRecentChangesStore = create<RecentChangesState>((set) => ({
  ids: new Set<string>(),
  mark: (id) => {
    set((state) => {
      const next = new Set(state.ids);
      next.add(id);
      return { ids: next };
    });

    const previousTimer = timers.get(id);
    if (previousTimer !== undefined) {
      clearTimeout(previousTimer);
    }

    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        set((state) => {
          if (!state.ids.has(id)) {
            return state;
          }
          const next = new Set(state.ids);
          next.delete(id);
          return { ids: next };
        });
      }, RECENT_CHANGE_MS),
    );
  },
}));
