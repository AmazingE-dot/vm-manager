import type { Os, VmStatus } from '@vm-manager/shared';

export const OS_LABELS: Record<Os, string> = {
  UBUNTU: 'Ubuntu',
  DEBIAN: 'Debian',
  WINDOWS_SERVER: 'Windows Server',
  CENTOS: 'CentOS',
  ROCKY: 'Rocky Linux',
};

export const VM_STATUS_LABELS: Record<VmStatus, string> = {
  RUNNING: 'Encendida',
  STOPPED: 'Apagada',
};
