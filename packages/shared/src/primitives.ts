import { z } from 'zod';

/** Identificador UUID (formato RFC 4122, como los genera Prisma). */
export const uuidSchema = z.uuid();

/** Marca temporal en formato ISO 8601 (serialización de `Date` de la API). */
export const isoDateTimeSchema = z.iso.datetime();

/** Mensaje para claves no reconocidas en esquemas estrictos (zod las reporta en inglés). */
export const UNRECOGNIZED_KEYS_MESSAGE = 'La petición contiene campos no permitidos';

/** Mapa de error de zod que solo reemplaza el mensaje de claves desconocidas. */
export function strictObjectError(issue: { code: string }): string | undefined {
  return issue.code === 'unrecognized_keys' ? UNRECOGNIZED_KEYS_MESSAGE : undefined;
}
