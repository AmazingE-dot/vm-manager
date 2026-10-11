import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  osSchema,
  roleSchema,
  userSchema,
  vmCreateSchema,
  vmNameSchema,
  vmSchema,
  vmUpdateSchema,
} from '../src/index.js';

const validVmInput = {
  name: 'web-server-01',
  cores: 4,
  ram: 16,
  disk: 100,
  os: 'UBUNTU',
} as const;

describe('vmNameSchema', () => {
  it('acepta nombres válidos', () => {
    for (const name of ['web-01', 'a1b', 'server', 'vm-123-test']) {
      expect(vmNameSchema.safeParse(name).success).toBe(true);
    }
  });

  it('rechaza mayúsculas, símbolos, guiones al borde y longitudes fuera de rango', () => {
    for (const name of ['Web-01', 'web_01', '-web', 'web-', 'ab', 'a'.repeat(33)]) {
      expect(vmNameSchema.safeParse(name).success).toBe(false);
    }
  });
});

describe('vmCreateSchema', () => {
  it('acepta un objeto válido y aplica STOPPED por defecto', () => {
    const result = vmCreateSchema.safeParse(validVmInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('STOPPED');
    }
  });

  it('convierte números enviados como texto (formularios)', () => {
    const result = vmCreateSchema.safeParse({
      ...validVmInput,
      cores: '8',
      ram: '32',
      disk: '512',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cores).toBe(8);
      expect(result.data.ram).toBe(32);
      expect(result.data.disk).toBe(512);
    }
  });

  it('rechaza recursos fuera de rango, no enteros, OS o estado desconocidos', () => {
    const invalidCases = [
      { cores: 0 },
      { cores: 65 },
      { cores: 2.5 },
      { ram: 0 },
      { ram: 513 },
      { disk: 9 },
      { disk: 4097 },
      { os: 'FREEBSD' },
      { status: 'PAUSED' },
    ];
    for (const invalidCase of invalidCases) {
      expect(vmCreateSchema.safeParse({ ...validVmInput, ...invalidCase }).success).toBe(false);
    }
  });
});

describe('vmUpdateSchema', () => {
  it('acepta actualizaciones parciales de cualquier campo', () => {
    expect(vmUpdateSchema.safeParse({ cores: 8 }).success).toBe(true);
    expect(vmUpdateSchema.safeParse({ status: 'RUNNING' }).success).toBe(true);
  });

  it('rechaza valores inválidos aunque sean parciales', () => {
    expect(vmUpdateSchema.safeParse({ ram: -1 }).success).toBe(false);
  });
});

describe('vmSchema', () => {
  const baseVm = {
    ...validVmInput,
    status: 'STOPPED',
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  };

  it('valida una VM completa devuelta por la API', () => {
    const vm = {
      id: '9f8c6f5e-1f2b-4a3c-9d4e-5f6a7b8c9d0e',
      ...baseVm,
      status: 'RUNNING',
    };
    expect(vmSchema.safeParse(vm).success).toBe(true);
  });

  it('rechaza ids que no son uuid o fechas que no son ISO', () => {
    const validId = '9f8c6f5e-1f2b-4a3c-9d4e-5f6a7b8c9d0e';
    expect(vmSchema.safeParse({ ...baseVm, id: 'no-es-uuid' }).success).toBe(false);
    expect(vmSchema.safeParse({ ...baseVm, id: validId, createdAt: 'ayer' }).success).toBe(false);
  });
});

describe('userSchema y enums', () => {
  it('valida un usuario público', () => {
    const user = {
      id: '1b645389-2477-4f4e-9d9c-8b1c2a3d4e5f',
      email: 'admin@ifx.test',
      name: 'Admin',
      role: 'ADMIN',
    };
    expect(userSchema.safeParse(user).success).toBe(true);
  });

  it('rechaza roles y sistemas operativos desconocidos', () => {
    expect(roleSchema.safeParse('SUPERADMIN').success).toBe(false);
    expect(osSchema.safeParse('MACOS').success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('acepta email y contraseña válidos', () => {
    expect(loginSchema.safeParse({ email: 'admin@ifx.test', password: 'Admin123!' }).success).toBe(
      true,
    );
  });

  it('rechaza email inválido, contraseña vacía o demasiado larga', () => {
    expect(loginSchema.safeParse({ email: 'no-es-email', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'admin@ifx.test', password: '' }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'admin@ifx.test', password: 'a'.repeat(73) }).success,
    ).toBe(false);
  });
});
