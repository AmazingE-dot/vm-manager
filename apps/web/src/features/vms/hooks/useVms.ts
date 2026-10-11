import type { Vm } from '@vm-manager/shared';
import { useQuery } from '@tanstack/react-query';
import { vmsApi } from '../api';

export interface VmsData {
  vms: Vm[];
}

export const vmsQueryKey = ['vms'] as const;

export function useVms() {
  return useQuery({
    queryKey: vmsQueryKey,
    queryFn: vmsApi.list,
    select: (data) => data.vms,
  });
}
