import { z } from 'zod';
import { osSchema, vmStatusSchema } from '../enums.js';
import { isoDateTimeSchema, strictObjectError, uuidSchema } from '../primitives.js';

/** Formato del nombre: minúsculas, números y guiones; empieza y termina alfanumérico. */
export const VM_NAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])$/;

export const vmNameSchema = z
  .string({ error: 'El nombre es obligatorio' })
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(32, 'El nombre debe tener como máximo 32 caracteres')
  .regex(VM_NAME_PATTERN, 'Solo minúsculas, números y guiones, sin empezar ni terminar con guion');

const coresSchema = z.coerce
  .number({ error: 'Introduce un número' })
  .int('Debe ser un número entero')
  .min(1, 'El mínimo es 1 núcleo')
  .max(64, 'El máximo es 64 núcleos');

const ramSchema = z.coerce
  .number({ error: 'Introduce un número' })
  .int('Debe ser un número entero')
  .min(1, 'El mínimo es 1 GB')
  .max(512, 'El máximo es 512 GB');

const diskSchema = z.coerce
  .number({ error: 'Introduce un número' })
  .int('Debe ser un número entero')
  .min(10, 'El mínimo es 10 GB')
  .max(4096, 'El máximo es 4096 GB');

export const vmCreateSchema = z
  .object(
    {
      name: vmNameSchema,
      cores: coresSchema,
      ram: ramSchema,
      disk: diskSchema,
      os: osSchema,
      status: vmStatusSchema.default('STOPPED'),
    },
    { error: strictObjectError },
  )
  .strict();
export type VmCreateInput = z.infer<typeof vmCreateSchema>;

/** Tipo de entrada del formulario (con las coerciones de zod) para react-hook-form. */
export type VmCreateFormInput = z.input<typeof vmCreateSchema>;

/** Actualización parcial: acepta cualquier subconjunto de campos (ver docs/DECISIONS.md). */
export const vmUpdateSchema = vmCreateSchema.partial();
export type VmUpdateInput = z.infer<typeof vmUpdateSchema>;

/** VM completa tal como la devuelve la API. */
export const vmSchema = z.object({
  id: uuidSchema,
  name: vmNameSchema,
  cores: coresSchema,
  ram: ramSchema,
  disk: diskSchema,
  os: osSchema,
  status: vmStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type Vm = z.infer<typeof vmSchema>;
