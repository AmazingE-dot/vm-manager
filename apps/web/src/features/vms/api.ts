import type { Vm, VmCreateInput, VmUpdateInput } from '@vm-manager/shared';
import { httpClient } from '../../lib/httpClient';

interface VmsResponse {
  vms: Vm[];
}

interface VmResponse {
  vm: Vm;
}

export const vmsApi = {
  list: () => httpClient.get<VmsResponse>('/vms'),
  create: (input: VmCreateInput) => httpClient.post<VmResponse>('/vms', input),
  update: (id: string, input: VmUpdateInput) => httpClient.put<VmResponse>(`/vms/${id}`, input),
  remove: (id: string) => httpClient.delete<void>(`/vms/${id}`),
};
