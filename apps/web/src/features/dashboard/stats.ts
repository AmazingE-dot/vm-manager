import type { Vm } from '@vm-manager/shared';

export interface ResourceTotals {
  cores: number;
  ram: number;
  disk: number;
}

export interface VmSummary {
  totalCount: number;
  activeCount: number;
  activeVms: Vm[];
  totals: ResourceTotals;
}

/** Suma los recursos (vCPU, RAM y disco) de las VMs encendidas. */
export function summarizeVms(vms: Vm[]): VmSummary {
  const activeVms = vms.filter((vm) => vm.status === 'RUNNING');

  const totals = activeVms.reduce<ResourceTotals>(
    (acc, vm) => ({
      cores: acc.cores + vm.cores,
      ram: acc.ram + vm.ram,
      disk: acc.disk + vm.disk,
    }),
    { cores: 0, ram: 0, disk: 0 },
  );

  return { totalCount: vms.length, activeCount: activeVms.length, activeVms, totals };
}
