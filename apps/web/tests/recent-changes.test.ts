import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RECENT_CHANGE_MS, useRecentChangesStore } from '../src/features/realtime/recentChanges';

describe('useRecentChangesStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRecentChangesStore.setState({ ids: new Set() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca un id y lo desmarca tras el tiempo de resaltado', () => {
    useRecentChangesStore.getState().mark('vm-1');
    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(true);

    vi.advanceTimersByTime(RECENT_CHANGE_MS);
    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(false);
  });

  it('renueva el temporizador si el id se vuelve a marcar', () => {
    const { mark } = useRecentChangesStore.getState();

    mark('vm-1');
    vi.advanceTimersByTime(RECENT_CHANGE_MS - 100);
    mark('vm-1');
    vi.advanceTimersByTime(RECENT_CHANGE_MS - 100);
    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(true);

    vi.advanceTimersByTime(200);
    expect(useRecentChangesStore.getState().ids.has('vm-1')).toBe(false);
  });
});
