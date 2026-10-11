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

## Fase 3 — Frontend base

### D3-1 · Tailwind 4 CSS-first con los tokens de AGENTS.md

Los tokens viven como variables CSS en `:root`/`.dark` y se mapean a Tailwind con `@theme inline`
(colores, tipografía, radios, sombras y curva de easing). Dark mode por clase con
`@custom-variant dark`; el vidrio esmerilado tiene fallback sólido vía `@supports`.

### D3-2 · Sesión y 401 sin recargar la página

El `httpClient` avisa de cualquier 401 y el store de sesión se limpia; los guards redirigen a
`/login` recordando el destino. La restauración usa `GET /me` una sola vez al arrancar y mientras
tanto se muestra un splash, para no rebotar al login en cada recarga.

### D3-3 · Dependencias añadidas fuera de la tabla del stack

`@tailwindcss/vite` (plugin oficial de Tailwind 4), `@testing-library/react` +
`@testing-library/jest-dom` + `jsdom` (los tests de componentes que pide la fila "Tests"),
`lucide-react` (el set de íconos que indica la sección de diseño) y `eslint-plugin-react-hooks`
(lint de hooks, en la raíz). Todas con justificación de una línea.

### D3-4 · Rutas de fases futuras como placeholders

`/`, `/vms`, `/vms/new` y `/vms/:id/edit` ya existen con contenido provisional ("Fase 4/5") y
sus guards activos; las fases siguientes solo reemplazan el contenido.

### D3-5 · Bundle único por ahora

Vite avisa de un chunk > 500 KB; se valorará code splitting en el pulido (Fase 7).

## Fase 4 — VMs en el front

### D4-1 · El formulario de edición usa el cache del listado

La API no expone `GET /vms/:id` (no está en la sección 6 de AGENTS.md), así que `/vms/:id/edit`
busca la VM en el cache de TanStack Query del listado (comparte la query con `/vms`).

### D4-2 · Detalle del optimistic UI

Crear agrega una VM temporal (`temp-<uuid>`, atenuada y con acciones deshabilitadas) que se
reemplaza por la real al confirmar; editar y eliminar parchean el cache. En `onError` se restaura
el snapshot y se muestra un toast con el mensaje de la API; `onSettled` invalida la query. El
toggle de estado de las tarjetas usa la misma mutación optimista (solo ADMIN).

### D4-3 · Errores del formulario

Además del toast de la mutación, el formulario mapea `CONFLICT` al campo `name` y los `details`
de la API a sus campos; el resto va a un error general visible sobre el botón.

### D4-4 · Tipo de entrada del formulario en `shared`

Se exportó `VmCreateFormInput` (`z.input`) desde `packages/shared` para tipar react-hook-form con
las coerciones de zod (patrón de tres genéricos del resolver).

## Fase 5 — Dashboard

### D5-1 · El dashboard comparte la query de VMs

`/` usa el mismo `useVms` que `/vms` (un solo cache de TanStack Query) y `summarizeVms` (función
pura y testeada) calcula las sumas contando solo las VMs `RUNNING`.

### D5-2 · Tres gráficos de barras en lugar de uno combinado

vCPU, RAM y disco tienen unidades distintas; mezclarlas en un único gráfico sería engañoso, así
que se muestran tres barras horizontales (azul/verde/naranja, esquinas redondeadas, sin
cuadrícula y tooltip minimalista), una por recurso y ordenadas de mayor a menor.

### D5-3 · Empty states diferenciados

Sin VMs creadas y sin VMs encendidas son situaciones distintas y el mensaje (y la llamada a la
acción) cambia en consecuencia; ambos casos tienen skeletons equivalentes en la carga y un estado
de error con reintentar.

### D5-4 · Línea base del bundle para la Fase 7

Con Recharts añadido, el build de producción queda en ~891 KB (267 KB gzip) y Vite avisa de
chunks > 500 KB. La optimización (React.lazy + manualChunks) se hará en la Fase 7 y se comparará
contra esta cifra, como pide AGENTS.md.
