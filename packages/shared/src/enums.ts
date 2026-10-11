import { z } from 'zod';

/** Roles de usuario soportados. */
export const ROLES = ['ADMIN', 'CLIENT'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** Estados posibles de una VM. */
export const VM_STATUSES = ['RUNNING', 'STOPPED'] as const;
export const vmStatusSchema = z.enum(VM_STATUSES);
export type VmStatus = z.infer<typeof vmStatusSchema>;

/** Sistemas operativos soportados. */
export const OPERATING_SYSTEMS = ['UBUNTU', 'DEBIAN', 'WINDOWS_SERVER', 'CENTOS', 'ROCKY'] as const;
export const osSchema = z.enum(OPERATING_SYSTEMS);
export type Os = z.infer<typeof osSchema>;
