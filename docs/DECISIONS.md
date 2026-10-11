# Decisiones — VM Manager

Registro de decisiones arquitectónicas y de las ambigüedades resueltas durante el desarrollo
(regla 9 de `AGENTS.md`). Es también insumo para el README (Fase 7).

## Fase 0 — Andamiaje

### D0-1 · `packages/shared` se compila a `dist` con `tsc`

`packages/shared` es un paquete ESM que compila a `dist/` (`tsc -w` en `dev`). Las apps lo consumen
como dependencia de workspace, no importan su código TS directamente. Motivo: un único formato de
consumo para la API (Node) y el front (Vite), con tipos incluidos.

### D0-2 · `PUT /vms/:id` acepta actualización parcial

`vmUpdateSchema` es `vmCreateSchema.partial()`: se puede enviar cualquier subconjunto de campos.
`AGENTS.md` (sección 6) lo permite y pide documentarlo; se repetirá en el README (Fase 7).

### D0-3 · Al crear una VM, `status` es opcional y por defecto `STOPPED`

Si el cuerpo de `POST /vms` no trae `status`, la VM nace apagada. Es lo más simple y evita crear
VMs "encendidas" sin una acción explícita.

### D0-4 · Mensajes de validación zod en español

Los mensajes de los esquemas compartidos van en español porque se muestran directamente en la UI
del formulario (Fase 4). Los códigos de error de la API siguen en inglés (`VALIDATION_ERROR`,
`UNAUTHORIZED`, etc.).

### D0-5 · Ubicación de `AGENTS.md` (pendiente de Carlos)

El archivo vive hoy en `docs/AGENTS.md`, mientras que el árbol de la sección 4 lo muestra en la
raíz. No se movió en la Fase 0 para no tocar material de Carlos; queda a su decisión.

### D0-6 · Scripts `db:migrate` y `db:seed` apuntan a la futura `apps/api`

Delegan en `@vm-manager/api` (Prisma), que se crea en la Fase 1. Hasta entonces esos dos scripts
fallan a propósito: no existe el paquete destino. `db:up` y `db:down` ya funcionan.

### D0-7 · TypeScript fijado en 6.0.3

`pnpm add -D typescript` resolvía TypeScript 7 (compilador nativo), pero `typescript-eslint` 8.x
solo soporta `>=4.8.4 <6.1.0`. Se fijó TS 6.0.3, la versión estable más nueva compatible con el
linter.

## Fase 1 — API base y auth

### D1-1 · El contenedor de PostgreSQL publica el puerto 5433

En la máquina de desarrollo hay un PostgreSQL nativo escuchando en 5432 (conflicto real al
conectar). El contenedor expone `5433:5432` y `DATABASE_URL` usa `localhost:5433`. En una máquina
sin ese conflicto el cambio es inocuo.

### D1-2 · Valores por defecto de entorno en desarrollo; fail-fast en producción

`apps/api` arranca sin `.env` (zod aplica defaults de desarrollo). Con `NODE_ENV=production` exige
`DATABASE_URL` y `JWT_SECRET` explícitos y falla al arrancar si faltan. Así el flujo "desde cero"
de la definición de terminado no requiere pasos manuales.

### D1-3 · TypeScript nativo de Node (sin `tsx`)

La API se ejecuta con el type-stripping nativo de Node 24 (`node --watch src/server.ts`), con
imports `.ts` (`allowImportingTsExtensions`) y build `tsc` con `rewriteRelativeImportExtensions`.
Motivo: no añadir `tsx` a la lista de dependencias del stack. Requiere Node ≥ 22.18.

### D1-4 · Prisma 7 con generador `prisma-client` y driver adapter

CLI y cliente fijados en 7.10.0 (estable; el registro npm marca `8.0.0-rc.22` como "latest"). El
cliente se genera en `apps/api/src/generated/prisma` (ignorado por git; se regenera en
`postinstall` y en `db:migrate`). Prisma 7 no carga `.env`: `prisma.config.ts` usa
`process.loadEnvFile()` en lugar de `dotenv`. `@prisma/adapter-pg` es obligatorio en v7 (única
dependencia añadida fuera de la lista de AGENTS.md, justificada por la versión estable del ORM).

### D1-5 · Cookie de sesión: `Secure` siempre y `SameSite` por env

`secure: true` también en localhost (Chrome/Firefox lo aceptan; Safari puede no hacerlo — se
documentará en el README, Fase 7). `logout` limpia la cookie con las mismas opciones base que el
login.

### D1-6 · CSRF: `application/json` obligatorio en mutaciones

Las mutaciones con cuerpo exigen `Content-Type: application/json`; si no, 415 con el formato de
error uniforme. Complementa `SameSite=Strict` (sección 7 de AGENTS.md) y no afecta a las
peticiones sin cuerpo.

### D1-7 · Los tests usan una base de datos aparte (`vmdb_test`)

`pnpm test` deriva `DATABASE_URL` a `vmdb_test` y aplica las migraciones en un `globalSetup` (crea
la base si falta). Los archivos de test corren en serie (`fileParallelism: false`) porque comparten
la base.

## Fase 2 — CRUD de VMs

### D2-1 · Formato de respuestas

`GET /vms` → `{ vms: [...] }`; `POST /vms` → `201 { vm }`; `PUT /vms/:id` → `{ vm }`;
`DELETE /vms/:id` → `204`. El envelope permite añadir paginación más adelante sin romper al
cliente.

### D2-2 · `PUT /vms/:id` acepta actualización parcial

Recordatorio de D0-2: `vmUpdateSchema = vmCreateSchema.partial()`; se puede enviar cualquier
subconjunto de campos (lo pide la sección 6 de AGENTS.md).

### D2-3 · Códigos de error de la API

`VALIDATION_ERROR` (400 con `details` por campo), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409, nombre duplicado), `RATE_LIMITED` (429) y, añadidos aquí:
`UNSUPPORTED_MEDIA_TYPE` (415, CSRF), `PAYLOAD_TOO_LARGE` (413, límite de body de 64 KB) e
`INTERNAL_ERROR` (500, sin stack traces en la respuesta).
