import type { FastifyRequest } from 'fastify';
import { UnsupportedMediaTypeError } from '../lib/errors.ts';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/**
 * CSRF: un formulario HTML no puede enviar `application/json`, así que exigirlo
 * en las mutaciones bloquea ese vector (complementa la cookie SameSite=Strict).
 * Las peticiones sin cuerpo (p. ej. POST /logout) no se ven afectadas.
 *
 * Nota: debe ser async. En Fastify v5 un hook síncrono que retorna undefined
 * nunca llama a `next` y cuelga el ciclo de vida de la petición.
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Fastify v5 exige que el hook devuelva una promesa
export async function requireJsonContentType(request: FastifyRequest): Promise<void> {
  if (!MUTATION_METHODS.has(request.method)) {
    return;
  }

  const contentLength = request.headers['content-length'];
  const hasBody =
    (contentLength !== undefined && contentLength !== '0') ||
    request.headers['transfer-encoding'] !== undefined;
  if (!hasBody) {
    return;
  }

  if (!isJsonContentType(request.headers['content-type'])) {
    throw new UnsupportedMediaTypeError();
  }
}

function isJsonContentType(contentType: string | undefined): boolean {
  return contentType?.split(';')[0]?.trim().toLowerCase() === 'application/json';
}
