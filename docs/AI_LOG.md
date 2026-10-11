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
