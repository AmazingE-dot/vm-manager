import type { Vm } from '@vm-manager/shared';
import { describe, expect, it } from 'vitest';
import { summarizeVms } from '../src/features/dashboard/stats';

function buildVm(overrides: Partial<Vm>): Vm {
  return {
    id: 'vm-1',
    name: 'vm',
    cores: 1,
    ram: 1,
    disk: 10,
    os: 'UBUNTU',
    status: 'STOPPED',
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('summarizeVms', () => {
  it('suma solo los recursos de las VMs encendidas', () => {
    const summary = summarizeVms([
      buildVm({ id: 'vm-1', status: 'RUNNING', cores: 4, ram: 8, disk: 80 }),
      buildVm({ id: 'vm-2', status: 'STOPPED', cores: 8, ram: 16, disk: 160 }),
      buildVm({ id: 'vm-3', status: 'RUNNING', cores: 2, ram: 2, disk: 20 }),
    ]);

    expect(summary.totalCount).toBe(3);
    expect(summary.activeCount).toBe(2);
    expect(summary.activeVms).toHaveLength(2);
    expect(summary.totals).toEqual({ cores: 6, ram: 10, disk: 100 });
  });

  it('devuelve ceros cuando no hay VMs encendidas', () => {
    const summary = summarizeVms([buildVm({ id: 'vm-1', status: 'STOPPED' })]);

    expect(summary.activeCount).toBe(0);
    expect(summary.activeVms).toEqual([]);
    expect(summary.totals).toEqual({ cores: 0, ram: 0, disk: 0 });
  });

  it('devuelve ceros con la lista vacía', () => {
    const summary = summarizeVms([]);

    expect(summary.totalCount).toBe(0);
    expect(summary.totals).toEqual({ cores: 0, ram: 0, disk: 0 });
  });
});
