import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('El email no es válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .max(72, 'La contraseña es demasiado larga'),
});
export type LoginInput = z.infer<typeof loginSchema>;
