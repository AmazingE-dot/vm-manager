# Bitácora de IA — VM Manager

Registro por fase del trabajo delegado a la IA (fuente de la sección «Bitácora de IA» del README;
ver `AGENTS.md`, sección 12).

## Fase 0 — Andamiaje

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Configuración raíz del monorepo pnpm: `package.json` con scripts (`dev`, `build`,
    `typecheck`, `test`, `lint`, `format`, `db:up`, `db:down`, `db:migrate`, `db:seed`),
    `tsconfig.base.json` estricto (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`,
    etc.) y `pnpm-workspace.yaml` con `onlyBuiltDependencies` para Prisma y esbuild.
  - Tooling: ESLint 10 (flat config) con `typescript-eslint` en modo con tipos y Prettier.
    TypeScript quedó fijado en 6.0.3 porque `typescript-eslint` aún no soporta la línea 7.
  - `docker-compose.yml` con PostgreSQL 17 (volumen y healthcheck). Verificado con `pnpm db:up`
    (contenedor en estado `healthy`) y `pnpm db:down`.
  - `packages/shared`: enums (`Role`, `VmStatus`, `Os`), esquemas zod de VM (creación, actualización
    parcial y entidad) y de usuario público, y 11 tests de vitest. Compila a `dist/` con `tsc`.
  - `.env.example` (sección 10 de `AGENTS.md`) y `docs/DECISIONS.md` con las decisiones D0-1 a
    D0-7.
  - Verificación: `pnpm lint`, `pnpm typecheck`, `pnpm test` (11/11) y `pnpm build` en verde.
  - Nota: Prettier reformateó `docs/AGENTS.md` en la primera pasada; se restauró el original y se
    excluyó el archivo de Prettier (`.prettierignore`). El repositorio aún no está inicializado
    en git, así que no hay commits de esta fase.
- **Intervención de Carlos:** <!-- lo completa Carlos: qué corrigió, decidió o reescribió -->
- **Prompt clave (opcional):** «Lee AGENTS.md completo. Ejecuta únicamente la Fase 0 (andamiaje).
  Cuando termines, detente, resume qué creaste y agrega la entrada de la Fase 0 en docs/AI_LOG.md.
  No avances a la Fase 1.»

## Fase 1 — API base y auth

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Paquete `apps/api` (Fastify 5) ejecutado con el type-stripping nativo de Node (sin `tsx`),
    `tsconfig` estricto y build con `tsc`.
  - Prisma 7.10 (estable; el registro marca `8.0.0-rc.22` como "latest") con el generador
    `prisma-client` y `@prisma/adapter-pg`: schema (User, Vm, enums), migración inicial y seed
    idempotente con `admin@ifx.test` y `client@ifx.test` (bcryptjs).
  - Config de entorno con zod (defaults de desarrollo; en producción exige `DATABASE_URL` y
    `JWT_SECRET`), `.env.example` y script que crea `.env` a partir del ejemplo si falta.
  - `POST /login`, `POST /logout`, `GET /me`: cookie HttpOnly/Secure/SameSite (configurable),
    JWT de 1 h, rate limit estricto en login, mensaje de error genérico y comparación de hash en
    tiempo constante (hash dummy para emails inexistentes).
  - Plugins cookie/jwt/cors/helmet/rate-limit, `errorHandler` uniforme, exigencia de
    `application/json` en mutaciones y logger con redacción de cookies y `authorization`.
  - 15 tests de API (vitest + `fastify.inject`) contra `vmdb_test`, migrada automáticamente por
    el `globalSetup`.
  - Incidencias resueltas: un hook `preValidation` síncrono colgaba el ciclo de vida en Fastify
    v5 (los hooks deben ser `async` o llamar a `next`) y el `errorResponseBuilder` de rate-limit
    debe devolver un `Error` (se devuelve un `AppError` para conservar el formato uniforme);
    ambos casos quedaron comentados en el código. Además, un build fallido de prueba dejó `.js`
    obsoletos en `packages/shared/src` que rompían la resolución de Vite (se limpiaron y el
    build de la API ya no mapea a las fuentes de `shared`).
  - Ajustes de entorno: Postgres local pasa al puerto 5433 (había un PostgreSQL nativo en 5432)
    y la configuración de pnpm 12 migró `onlyBuiltDependencies` → `allowBuilds`.
- **Intervención de Carlos:** <!-- lo completa Carlos: qué corrigió, decidió o reescribió -->
- **Prompt clave (opcional):** «Pasa a la fase 2, ya inicialice git y ya movi manualmente
  agents.md a la raiz» (alcance confirmado: Fases 1 y 2 seguidas).

## Fase 2 — CRUD de VMs

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - `GET /vms` (ADMIN y CLIENT) y `POST`/`PUT`/`DELETE /vms` (solo ADMIN) con validación zod de
    `packages/shared`, capas repository/service/routes y errores uniformes.
  - 409 en nombre duplicado (P2002 de Prisma), 404 en VM inexistente, 400 en id inválido y 403
    para CLIENT en mutaciones.
  - Tests de permisos y validación: CLIENT lista pero recibe 403 al mutar (y nada se escribe),
    duplicado 409, PUT parcial y validaciones 400 con `details`.
  - Verificación manual contra el servidor real: cookie con flags correctos, login sin token en
    el body y respuestas 403/409/415 esperadas.
- **Intervención de Carlos:** <!-- lo completa Carlos: qué corrigió, decidió o reescribió -->
- **Prompt clave (opcional):** — (mismo hilo que la Fase 1).
