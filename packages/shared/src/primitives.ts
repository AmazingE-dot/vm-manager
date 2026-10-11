import { z } from 'zod';

/** Identificador UUID (formato RFC 4122, como los genera Prisma). */
export const uuidSchema = z.uuid();

/** Marca temporal en formato ISO 8601 (serialización de `Date` de la API). */
export const isoDateTimeSchema = z.iso.datetime();
