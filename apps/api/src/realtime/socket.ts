import type { Role, Vm } from '@vm-manager/shared';
import { VM_EVENTS } from '@vm-manager/shared';
import type { FastifyInstance } from 'fastify';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env.ts';

interface SocketUser {
  sub: string;
  role: Role;
}

export interface ServerToClientEvents {
  'vm:created': (vm: Vm) => void;
  'vm:updated': (vm: Vm) => void;
  'vm:deleted': (vm: Vm) => void;
}

// Sin eventos cliente → servidor por ahora.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- socket.io exige un mapa de eventos
export interface ClientToServerEvents {}

interface SocketData {
  user: SocketUser;
}

/** Eventos de VMs que la capa de servicio emite tras confirmar la escritura en DB. */
export interface VmEvents {
  emitVmCreated(vm: Vm): void;
  emitVmUpdated(vm: Vm): void;
  emitVmDeleted(vm: Vm): void;
}

declare module 'fastify' {
  interface FastifyInstance {
    vmEvents: VmEvents;
  }
}

/**
 * socket.io montado sobre el servidor HTTP de Fastify. La autenticación lee la
 * cookie del handshake y verifica el JWT; nada de token en query string.
 */
export function createRealtime(app: FastifyInstance): SocketServer {
  const io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(app.server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const cookies = app.parseCookie(socket.handshake.headers.cookie ?? '');
      const token = cookies.token;
      if (!token) {
        throw new Error('sin cookie de sesión');
      }
      socket.data.user = app.jwt.verify<SocketUser>(token);
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  return io;
}

export function createVmEventEmitter(io: SocketServer): VmEvents {
  return {
    emitVmCreated: (vm) => {
      io.emit(VM_EVENTS.created, vm);
    },
    emitVmUpdated: (vm) => {
      io.emit(VM_EVENTS.updated, vm);
    },
    emitVmDeleted: (vm) => {
      io.emit(VM_EVENTS.deleted, vm);
    },
  };
}
