/** Nombres de los eventos de VMs emitidos por socket.io (servidor y cliente). */
export const VM_EVENTS = {
  created: 'vm:created',
  updated: 'vm:updated',
  deleted: 'vm:deleted',
} as const;

export type VmEventName = (typeof VM_EVENTS)[keyof typeof VM_EVENTS];
