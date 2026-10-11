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
- **Intervención de Carlos Eduardo (Intervención humana):**
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
- **Intervención de Carlos Eduardo (Intervención humana):**
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
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** — (mismo hilo que la Fase 1).

## Fase 3 — Frontend base

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - `apps/web` (Vite 8 + React 19 + TypeScript) con el sistema de diseño de AGENTS.md, sección 9:
    tokens como variables CSS conmutables por tema y mapeados a Tailwind 4 (`@theme inline`),
    tipografía y radios fijos, sombras suaves (sin sombra en dark), barra con efecto vidrio y
    fallback sólido.
  - Dark mode por clase: script inline en `index.html` (sin parpadeo), respeta
    `prefers-color-scheme` en la primera visita y persiste la preferencia en `localStorage`.
  - `httpClient` único (fetch con `credentials: 'include'`), errores uniformes y 401 que limpia
    la sesión; store de sesión en Zustand y restauración con `GET /me` al arrancar (splash
    mientras carga).
  - Router (React Router 8) con `ProtectedRoute` (redirige a `/login` recordando el destino) y
    `AdminRoute` (un CLIENT que entre por URL a `/vms/new` es redirigido); la página de login
    redirige si ya hay sesión.
  - LoginPage con react-hook-form + zodResolver usando `loginSchema` de `packages/shared`,
    validación en tiempo real, botón deshabilitado si es inválido y error genérico del servidor.
  - Layout con barra superior (glass), navegación, toggle de tema y cerrar sesión; componentes
    propios (Button, TextInput, Card, EmptyState, Spinner, ThemeToggle, PageHeader) y
    placeholders de Dashboard/VMs/Formulario para las Fases 4 y 5.
  - 6 tests de componentes críticos (guards y formulario de login) con Testing Library + jsdom;
    la suite total del repo queda en 34 tests.
  - Smoke real con ambos servidores: SPA servida, proxy `/api` funcionando (401/200), login sin
    token en el body, CSRF 415 y tokens presentes en el CSS compilado.
  - Dependencias fuera de la tabla del stack (justificadas): `@tailwindcss/vite` (plugin oficial
    de Tailwind 4), Testing Library + jsdom (tests de componentes), `lucide-react` (íconos,
    indicado por la sección de diseño) y `eslint-plugin-react-hooks` (lint de hooks, en la raíz).
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Vamos a la fase 3».

## Fase 4 — VMs en el front

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Listado `/vms` con búsqueda por nombre, segmented control (Todas/Encendidas/Apagadas), grid
    responsive de tarjetas (1/2/3 columnas), skeletons durante la carga, empty state con CTA solo
    para ADMIN y estado "sin resultados" con limpiar filtros.
  - Formulario `/vms/new` y `/vms/:id/edit` con react-hook-form + `vmCreateSchema` compartido,
    validación en tiempo real (`onChange`), botón deshabilitado si es inválido, errores por campo
    y toggle iOS para el estado.
  - Mutaciones con UI optimista: crear inserta una VM temporal `temp-<uuid>` (atenuada, con
    spinner y acciones deshabilitadas) que se reemplaza al confirmar; editar y eliminar parchean
    el cache; `onError` restaura el snapshot y muestra toast; `onSettled` invalida.
  - `<Can role="ADMIN">` y `useCan()`: un CLIENT no ve crear, editar, eliminar ni el toggle.
  - Diálogo de confirmación antes de eliminar (fondo oscurecido + blur, Escape, estado pendiente)
    y toasts de éxito/error con sonner.
  - Componentes nuevos: Skeleton, SegmentedControl, Toggle, ConfirmDialog, Select y Can.
  - El formulario de edición lee la VM del cache del listado (la API no tiene `GET /vms/:id`).
  - 5 tests nuevos (rollback del optimista al crear/borrar, reemplazo del temporal, visibilidad
    por rol); la suite total queda en 39 tests.
  - Smoke con servidores reales vía el proxy de Vite: 201/200/409/400/204 y la base de datos
    queda limpia al final.
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Sigue con la siguiente fase».
