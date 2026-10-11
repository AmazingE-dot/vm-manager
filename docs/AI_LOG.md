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

## Fase 5 — Dashboard

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - `/` muestra 4 tarjetas de resumen (VMs encendidas, vCPU, RAM y disco en uso) con la suma de
    los recursos de las VMs `RUNNING`, y tres gráficos Recharts de barras horizontales (vCPU
    azul, RAM verde, disco naranja) con esquinas redondeadas, sin cuadrícula y tooltip
    minimalista, siguiendo la sección de diseño de AGENTS.md.
  - El dashboard reutiliza la query de VMs (mismo cache que `/vms`) y calcula las sumas en una
    función pura (`summarizeVms`) cubierta por tests.
  - Estados completos: skeletons de tarjetas y gráficos durante la carga, empty state en dos
    variantes (sin VMs creadas / sin VMs encendidas) y error con reintentar.
  - 6 tests nuevos (3 de `summarizeVms` y 3 de `DashboardPage` con Recharts real en jsdom); la
    suite total queda en 45 tests.
  - Línea base del bundle para la Fase 7: el build queda en ~891 KB (267 KB gzip) con el aviso de
    chunks > 500 KB; la optimización se hará en el pulido, como se indicó en AGENTS.md.
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Siguiente fase».

## Fase 6 — Realtime

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - socket.io 4.8 montado directamente sobre el servidor HTTP de Fastify (sin plugin intermedio,
    que no está en la lista del stack): la autenticación lee la cookie del handshake con
    `app.parseCookie` y verifica el JWT con `app.jwt.verify`; sin cookie o con token inválido la
    conexión se rechaza con `UNAUTHORIZED` (nada de token en query string).
  - Los eventos `vm:created`, `vm:updated` y `vm:deleted` (nombres compartidos en
    `packages/shared`) se emiten desde la capa de servicio, después de confirmar la escritura,
    con el payload de la VM serializado a ISO.
  - Cliente: singleton de socket en `features/realtime` y hook `useVmRealtime` montado en el
    layout autenticado; actualiza el cache de TanStack Query con `setQueryData` comparando
    `updatedAt` (idempotente: el originador no ve duplicados ni doble resaltado) y marca el id
    ~1.5 s en un store Zustand para el pulso.
  - Resaltado: animación CSS sutil de borde/fondo (1.5 s, curva suave) en la tarjeta, que respeta
    `prefers-reduced-motion` con la regla global de animaciones reducidas.
  - 9 tests nuevos: 2 de integración en la API con socket.io-client real (rechazo sin cookie y
    secuencia created/updated/deleted) y 7 en el front (store de cambios recientes, hook con
    socket simulado —inserción, actualización sin duplicar, eco ignorado y borrado— y resaltado
    de la tarjeta). La suite total queda en 54 tests.
  - Smoke real con el stack completo: cliente socket.io conectado **a través del proxy ws de
    Vite** (rechazo sin cookie, conexión autenticada y los tres eventos verificados).
  - Bundle tras la fase: 933 KB (281 KB gzip); sigue pendiente la optimización de la Fase 7.
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «vamos con el siguiente paso».

## Fase 7 — Pulido y documentación

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Optimización de bundle: páginas con `React.lazy` + `Suspense` (fallback de skeletons) y
    separación de dependencias por grupos de `codeSplitting` (Rolldown, la API vigente en Vite 8)
    en `vite.config.ts`. Antes: un único chunk de 933 KB (281 KB gzip) con aviso de Vite.
    Después: 24 chunks, el mayor de 312 KB (98 KB gzip), páginas de 2–9 KB y Recharts
    descargándose solo al abrir el Dashboard; el aviso desaparece.
  - Accesibilidad: enlace "Saltar al contenido", landmark `main` también en el login y título de
    documento por página (`useDocumentTitle`).
  - `README.md` completo (guía paso a paso, credenciales, diagrama, decisiones resumidas,
    estructura de carpetas y la bitácora de IA) y `docs/architecture.md` con el diagrama Mermaid
    Cliente <-> API <-> WebSocket.
  - Verificación final: lint, typecheck, 54 tests, format y build en verde; smoke con el stack
    completo (SPA + login + /api/vms + módulos en dev) tras los cambios.
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Pasemos a la fase 7».

## Post-Fase 7 — Ajustes de la revisión de Carlos

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Mensajes de validación en inglés: al vaciar un input numérico zod mostraba
    "Invalid input: expected number, received NaN". Se añadieron mensajes base en español a los
    esquemas compartidos (`Introduce un número`, `El nombre es obligatorio`, enums y contraseña) y
    un test que los fija.
  - El formulario de crear/editar VM ahora es una **ventana modal** sobre el listado, con
    transición de entrada/salida (backdrop con blur, panel con escala/desplazamiento, 200/180 ms,
    respeta `prefers-reduced-motion`), cierre con Escape, clic en el fondo y botón X; las rutas
    `/vms/new` y `/vms/:id/edit` se mantienen (guard de ADMIN incluido) y el listado queda visible
    detrás. `ConfirmDialog` se refactorizó sobre el mismo componente `Modal` y también anima la
    salida al cancelar.
  - Cursores: Tailwind v4 no pone `pointer` en los botones (se restauró globalmente para botones y
    `role="button"`) y los controles deshabilitados ahora muestran `cursor-not-allowed` en lugar de
    bloquear el puntero (incluido el enlace de editar en VMs pendientes).
  - 4 tests nuevos (3 del modal — incluida la validación en español — y los mensajes de esquema);
    suite total: 58 tests. Build sin advertencias (25 chunks, el mayor 312 KB).
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Hay algunos fallos, cuando quito del input vCPU se ve el siguiente
  texto: nvalid input: expected number, received NaN, eso pasa con más inputs, al darle crear VM,
  me gustaría que funcionara más como una ventana modal con su respectiva transición, cuando paso
  el mouse sobre algunos botones no se ve bien el cursor pointer, cuando voy a crear una VM y se
  desactiva el botón por falta de datos debería aparecer el cursor-blocked de tailwind.»

## Marca IFX — nombre y sistema de diseño

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Tokens: `--accent` pasa al azul IFX (#0038E8 en claro / #3D6BFF en oscuro) y se añaden
    `--accent-violet`, `--accent-cyan` y `--brand-gradient`, mapeados a Tailwind (`@theme inline`).
  - Logo por tema (`ifx-logo.webp` / `ifx-logo-dark.webp`, según la clase `.dark`) en la pantalla
    de login y la barra superior, mostrado solo por altura (sin recolorear ni estirar); favicon con
    `ifx-mark.webp`.
  - El degradado de marca aparece únicamente como halo difuminado y sutil en el login.
  - Gráficos del dashboard: vCPU = azul IFX, RAM = violeta, disco = cian (semántica de estados
    intacta: verde encendida, gris apagada, rojo destructivo).
  - Nombre "IFX VM Manager" en el título de la pestaña, los títulos de página y el README.
  - Auditoría de colores: no quedaban azules del esquema anterior hardcodeados fuera de los tokens
    de `styles/index.css` (se reemplazaron ambos).
  - Verificación: lint, typecheck, 59 tests, format y build en verde (el build copia
    `public/brand/` y el favicon queda referenciado).
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Lee AGENTS.md, sección 9, bloque "Identidad de marca (IFX)", y la
  tabla de tokens actualizada. Los logos ya están en apps/web/public/brand/. Tarea: aplicar la
  identidad de marca.» (y «Cambia el nombre de la página por IFX VM Manager»).

## Ajuste de contraste — buscador en modo claro

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - El buscador del listado se perdía sobre el fondo claro: usaba `--surface-2` (#F2F2F7), casi
    idéntico al fondo de página (`--bg` #F5F5F7). Ahora usa el mismo tratamiento que las tarjetas
    (`--surface` + borde `--separator`) y se lee como un campo en ambos temas.
  - Los placeholders (buscador y campos de formulario) pasan de `--text-secondary` al 70 % de
    opacidad a opacidad completa, para cumplir contraste AA en claro y oscuro.
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «No se ve bien el Buscar por nombre... en el modo light».

## Splash de marca — logo que se llena de color

- **Herramienta:** opencode + DeepSeek V4.1 Flash
- **Delegado a la IA:**
  - Componente `SplashScreen` en `components/`: dos capas apiladas del logo (base en escala de
    grises al 18 % de opacidad — única excepción permitida a la regla de no filtrar el logo — y
    superior a color revelada con `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` en 1.3 s con
    la curva de la casa); tras el relleno queda un pulso de opacidad muy sutil. Variante clara y
    oscura con los dos webp.
  - Lógica anti-parpadeo en `useSplashVisibility` (mismo archivo): el contenedor existe desde el
    inicio (accesible con `role="status"` y `aria-label="Cargando"`) pero permanece invisible los
    primeros 300 ms; si la sesión se resuelve antes, nunca se ve; si se muestra, se mantiene al
    menos 1.3 s y sale con un fade de 200 ms.
  - `ProtectedRoute` usa el componente durante la restauración de sesión (`GET /me`) y el fallback
    de Suspense de `/login` también; se eliminó el spinner genérico.
  - `prefers-reduced-motion`: el logo se muestra a color y estático, sin animación de relleno.
  - Splash mínimo inline en `index.html` (punto opcional del bloque) para que no haya pantalla en
    blanco antes de que React monte; React lo reemplaza al renderizar.
  - 3 tests del componente (role/aria, las dos capas por tema y el estado invisible previo al
    retraso), sin tocar el resto de tests; suite total: 62 tests.
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** «Lee AGENTS.md, sección 9, bloque "Pantalla de carga (splash) de
  marca". Tarea: implementar el SplashScreen con el efecto de logo llenándose de color.»
