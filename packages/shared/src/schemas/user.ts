import { z } from 'zod';
import { roleSchema } from '../enums.js';
import { uuidSchema } from '../primitives.js';

/** Usuario expuesto por la API; nunca incluye `passwordHash`. */
export const userSchema = z.object({
  id: uuidSchema,
  email: z.email(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  role: roleSchema,
});
export type User = z.infer<typeof userSchema>;
