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
