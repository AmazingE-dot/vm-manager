import type { Vm } from '@vm-manager/shared';
import { io, type Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  'vm:created': (vm: Vm) => void;
  'vm:updated': (vm: Vm) => void;
  'vm:deleted': (vm: Vm) => void;
}

export type VmSocket = Socket<ServerToClientEvents>;

let socket: VmSocket | null = null;

/** Singleton del socket; se conecta al mismo origen (Vite hace proxy de /socket.io). */
export function getSocket(): VmSocket {
  // `io()` no expone genéricos en esta versión; se tipa la instancia con los eventos.
  socket ??= io({ withCredentials: true, autoConnect: false }) as VmSocket;
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
