# AGENTS.md — VM Manager (Prueba técnica IFX Full Stack)

> Este archivo es el contexto permanente del proyecto. Léelo completo antes de actuar.
> Idioma de código e identificadores: inglés. Idioma de UI, README y documentación: español.

## 1. Contexto

SPA pulida y responsiva para gestionar máquinas virtuales (VMs) más una API REST de soporte con enfoque en seguridad. El frontend es el protagonista. Plazo total: 2 días. Se evalúa arquitectura de componentes, estado global, fidelidad visual, seguridad del backend, código limpio y la capacidad de guiar a la IA (por eso existe la Bitácora de IA, ver sección 12).

## 2. Reglas de trabajo para el agente

1. Trabaja **una fase a la vez** (sección 11). Al terminar una fase, detente, resume lo hecho y espera revisión de Carlos.
2. No agregues dependencias fuera de la lista de la sección 3 sin justificarlo en una línea y pedir confirmación.
3. Código simple y tipado. Nada de `any`; `strict: true` en todos los `tsconfig`.
4. Valida toda entrada con Zod. Los esquemas viven en `packages/shared` y se reutilizan en front y back.
5. No inventes APIs de librerías: ante duda, consulta la documentación vigente de la versión instalada.
6. Commits pequeños con Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
7. Nunca guardes el JWT en `localStorage`, `sessionStorage`, ni lo devuelvas en el body. Nunca loguees cookies, tokens ni passwords.
8. Después de cada fase, agrega una entrada en `docs/AI_LOG.md` (ver sección 12). Deja el campo "Intervención de Carlos" vacío para que él lo complete; no lo rellenes tú.
9. Si un requisito es ambiguo, elige la opción más simple, documéntala en `docs/DECISIONS.md` y sigue.

## 3. Stack

| Capa | Tecnología |
|---|---|
| Monorepo | pnpm workspaces, Node 22+ |
| Frontend | React + Vite + TypeScript |
| Estilos | Tailwind CSS (modo `class` para dark mode), componentes propios o shadcn/ui |
| Estado servidor | TanStack Query (cache, optimistic updates, rollback) |
| Estado cliente global | Zustand (sesión/usuario, tema, UI) |
| Rutas | React Router |
| Formularios | react-hook-form + zod resolver |
| Gráficos | Recharts |
| Toasts | sonner |
| Realtime cliente | socket.io-client |
| Backend | Node.js + TypeScript + Fastify |
| Plugins Fastify | @fastify/cookie, @fastify/jwt, @fastify/cors, @fastify/helmet, @fastify/rate-limit |
| Realtime servidor | socket.io (sobre el mismo servidor HTTP de Fastify) |
| DB | PostgreSQL |
| ORM / migraciones | Prisma (usar la versión estable actual y su documentación vigente) |
| Hash de passwords | bcryptjs (evita compilación nativa en Windows) |
| Validación | zod (compartido en `packages/shared`) |
| Tests | vitest (API con `fastify.inject`; front: pocos tests de componentes críticos) |
| Infra local | Docker Compose para PostgreSQL |

**Base de datos:** el camino por defecto es PostgreSQL en Docker Compose, para que quien revise la prueba levante todo desde cero sin cuentas externas. Supabase solo se usa como host de Postgres cambiando `DATABASE_URL`; no se usa el cliente ni el Auth de Supabase.

## 4. Estructura del monorepo

```
.
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── pnpm-workspace.yaml
├── docs/
│   ├── AI_LOG.md            # Bitácora de IA (fuente del README)
│   ├── DECISIONS.md         # Decisiones arquitectónicas
│   └── architecture.md      # Diagrama (Mermaid): Cliente <-> API <-> WebSocket
├── packages/
│   └── shared/              # Esquemas zod, tipos y enums compartidos (Role, VmStatus, Os)
└── apps/
    ├── api/
    │   ├── prisma/          # schema.prisma, migrations, seed.ts
    │   └── src/
    │       ├── config/      # env validado con zod al arrancar
    │       ├── plugins/     # cookie, jwt, cors, helmet, rate-limit, socket
    │       ├── modules/
    │       │   ├── auth/    # routes, service, schemas
    │       │   └── vms/     # routes, service, repository, schemas
    │       ├── middleware/  # authenticate, requireRole
    │       ├── realtime/    # socket server + emisión de eventos
    │       ├── lib/         # errores, logger
    │       └── server.ts
    └── web/
        └── src/
            ├── app/         # providers, router, guards (ProtectedRoute, AdminRoute)
            ├── features/
            │   ├── auth/    # LoginPage, useAuth, authStore, api
            │   ├── vms/     # components, hooks (useVms, useVmMutations), api, VmFormPage, VmListPage
            │   ├── dashboard/ # DashboardPage, ResourceCharts, StatCards
            │   └── realtime/  # socket client, useVmRealtime
            ├── components/  # UI genérica: Button, Card, Skeleton, EmptyState, ThemeToggle, Can
            ├── lib/         # httpClient (fetch con credentials), queryClient, utils
            └── styles/
```

Regla: el código por funcionalidad vive en `features/`; `components/` es solo UI genérica sin lógica de negocio.

## 5. Modelo de datos

**User**: `id` (uuid), `email` (único), `passwordHash`, `name`, `role` (`ADMIN` | `CLIENT`), `createdAt`.

**Vm**: `id` (uuid), `name` (único), `cores` (int), `ram` (int, GB), `disk` (int, GB), `os` (enum), `status` (`RUNNING` | `STOPPED`), `createdAt`, `updatedAt`.

Reglas de validación (en `packages/shared`, usadas en front y back):
- `name`: 3–32 caracteres, `^[a-z0-9]([a-z0-9-]*[a-z0-9])$` (minúsculas, números y guiones), único.
- `cores`: entero 1–64. `ram`: entero 1–512 (GB). `disk`: entero 10–4096 (GB). Nunca negativos.
- `os`: enum cerrado (por ejemplo `UBUNTU`, `DEBIAN`, `WINDOWS_SERVER`, `CENTOS`, `ROCKY`).
- `status`: `RUNNING` (Encendida) | `STOPPED` (Apagada).

## 6. API (sin prefijo; el front la consume vía `/api` con proxy)

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/login` | público | Valida email/password. Setea cookie. Body de respuesta: solo `{ user: { id, email, name, role } }` |
| POST | `/logout` | autenticado | Limpia la cookie |
| GET | `/me` | autenticado | Devuelve el usuario de la sesión (el front no puede leer la cookie, así restaura sesión) |
| GET | `/vms` | ADMIN y CLIENT | Lista todas |
| POST | `/vms` | ADMIN | Crea |
| PUT | `/vms/:id` | ADMIN | Actualiza (acepta actualización parcial; documentarlo) |
| DELETE | `/vms/:id` | ADMIN | Elimina |

Formato de error uniforme: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`. Códigos HTTP correctos: 400, 401, 403, 404, 409 (nombre duplicado), 429.

## 7. Seguridad (prioridad alta)

- JWT firmado, expiración corta (ej. 1 h), guardado **solo** en cookie `HttpOnly; Secure; SameSite=Strict`, con `path=/`. `SameSite` configurable por env (`COOKIE_SAMESITE`) para despliegues con front y API en sitios distintos (ahí se requiere `None` + `Secure`).
- `Secure` funciona en `http://localhost` en Chrome y Firefox; documentar en el README que Safari puede no aceptarla en localhost.
- Autorización **siempre en el servidor**: `authenticate` (verifica cookie/JWT) y `requireRole('ADMIN')` como `preHandler`. Ocultar botones en la UI es solo UX, no seguridad.
- `POST /login`: mensaje de error genérico (no revelar si el email existe), rate limit estricto, comparación de hash en tiempo constante.
- CORS restrictivo (origen explícito desde env, `credentials: true`). `helmet` activo. Límite de tamaño de body.
- Protección CSRF: `SameSite=Strict` + exigir `Content-Type: application/json` en mutaciones. Documentar la decisión.
- Variables de entorno validadas con zod al arrancar; el servidor falla rápido si faltan. `.env.example` sin secretos reales.
- Logs con `pino`, redactando `cookie`, `authorization` y passwords.
- Sin stack traces en respuestas de error en producción.

## 8. Realtime (Plus)

- socket.io montado sobre el servidor HTTP de Fastify.
- Autenticación del socket: leer la cookie en `socket.handshake.headers.cookie`, verificar el JWT y rechazar la conexión si es inválido. Nada de token en query string.
- Eventos servidor → clientes: `vm:created`, `vm:updated`, `vm:deleted` con el payload de la VM. Se emiten **después** de confirmar la escritura en DB, desde la capa de servicio.
- Cliente (`features/realtime`): al recibir un evento, actualizar el cache de TanStack Query (`setQueryData`) y marcar el id como "cambiado recientemente" ~1.5 s para disparar una animación sutil (resaltado de borde/fondo) en la tarjeta.
- Evitar doble animación o duplicados en quien originó el cambio: el handler debe ser idempotente (comparar `updatedAt`/existencia del id).
- El proxy de Vite debe permitir `ws: true` para `/socket.io`.

## 9. Frontend: requisitos clave

**Rutas**
- `/login` (pública).
- `/` Dashboard (privada): tarjetas de resumen + gráficos Recharts con la suma de cores, RAM y disco de las VMs **activas** (`RUNNING`).
- `/vms` Listado (privado): tarjetas/tabla con búsqueda y filtro por estado, skeletons, empty state.
- `/vms/new` y `/vms/:id/edit` (privadas, solo ADMIN): formulario con validación en tiempo real (`mode: 'onChange'`), mensajes claros por campo, botón deshabilitado si es inválido. Un CLIENT que entre por URL es redirigido.

**Roles en la UI**
- Componente `<Can role="ADMIN">` o hook `useCan()`. Para CLIENT, los botones de crear, editar y eliminar **no se renderizan** (no solo deshabilitados).

**Optimistic UI** (TanStack Query)
- Crear, actualizar y eliminar usan `onMutate` (cancelar queries, guardar snapshot, aplicar cambio al cache), `onError` (rollback al snapshot + toast de error) y `onSettled` (invalidar/refetch).
- Crear usa un id temporal (`temp-<uuid>`) y estilo visual de "pendiente"; se reemplaza al confirmar.

**Feedback visual**
- Skeletons durante la carga, toasts (sonner) de éxito y error, empty states con llamada a la acción (solo ADMIN ve el botón de crear).

**Dark mode nativo**
- Tailwind `darkMode: 'class'`, respeta `prefers-color-scheme` en la primera visita, preferencia persistida (guardar el tema en `localStorage` es aceptable; el token no). Script inline en `index.html` para evitar parpadeo al cargar. Paleta con tokens/variables CSS, no colores sueltos.

**Estética y sistema de diseño (inspirado en Apple Human Interface Guidelines)**

Objetivo: interfaz limpia, con mucho aire, jerarquía tipográfica clara y movimiento sutil. Es una inspiración de lenguaje visual; no uses logos, íconos ni assets de Apple.

*Principios*
- Claridad, deferencia y profundidad: el contenido manda, la UI no compite con él.
- Mucho espacio en blanco. Una sola acción primaria por pantalla.
- Nada de bordes gruesos ni colores saturados de fondo; la jerarquía se logra con tipografía, espaciado y capas.

*Tipografía*
- Familia: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", system-ui, sans-serif`. No incluyas ni cargues SF Pro (no es de uso libre en web); en Windows el fallback será Inter o la fuente del sistema.
- Títulos grandes y con peso `600`, `letter-spacing` ligeramente negativo (-0.02em); texto de apoyo en gris secundario.
- Escala sugerida: 34 (título de página) / 22 (sección) / 17 (cuerpo) / 15 (secundario) / 13 (caption). Interlineado 1.4–1.5 en cuerpo.

*Tokens de color (definir como variables CSS y mapearlos en Tailwind; no usar colores sueltos)*

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F5F5F7` | `#000000` |
| `--surface` | `#FFFFFF` | `#1C1C1E` |
| `--surface-2` | `#F2F2F7` | `#2C2C2E` |
| `--text` | `#1D1D1F` | `#F5F5F7` |
| `--text-secondary` | `#6E6E73` | `#98989D` |
| `--separator` | `rgba(60,60,67,0.18)` | `rgba(84,84,88,0.65)` |
| `--accent` (azul) | `#007AFF` | `#0A84FF` |
| `--success` (verde) | `#34C759` | `#30D158` |
| `--warning` (naranja) | `#FF9F0A` | `#FF9F0A` |
| `--danger` (rojo) | `#FF3B30` | `#FF453A` |

- Un solo color de acento (azul). Verde = VM encendida, gris = apagada, rojo solo para acciones destructivas y errores.
- Fondo de página distinto al de las tarjetas para dar profundidad (`--bg` vs `--surface`).

*Formas, sombras y capas*
- Radios: tarjetas 16–20px, botones e inputs 10–12px, chips/badges totalmente redondeados. Usar siempre los mismos valores.
- Sombras muy suaves y difusas (por ejemplo `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`); en dark mode casi sin sombra, separar con borde fino `--separator`.
- Barra superior/lateral con efecto vidrio esmerilado: `backdrop-filter: saturate(180%) blur(20px)` sobre fondo semitransparente. Debe haber fallback sólido si `backdrop-filter` no está disponible.
- Bordes de 1px con `--separator`; evitar bordes oscuros o gruesos.

*Componentes*
- Botón primario: relleno azul, texto blanco, sin sombra fuerte, altura mínima 44px (zona táctil). Secundario: fondo `--surface-2`. Destructivo: texto/relleno rojo, siempre con diálogo de confirmación.
- Inputs: fondo `--surface-2`, sin borde visible en reposo, anillo de foco azul de 3–4px con baja opacidad; error con texto rojo debajo del campo.
- Filtro de estado (Todas / Encendidas / Apagadas) como **segmented control** estilo iOS.
- Badges de estado tipo "pill" con punto de color y texto.
- Interruptor de encender/apagar como **toggle estilo iOS**.
- Diálogos y confirmaciones como hoja centrada con fondo oscurecido y blur, esquinas 20px.
- Listado en tarjetas con espaciado generoso; tabla solo si aporta, con filas altas y separadores finos, sin cebra.
- Toasts discretos, arriba o abajo al centro, con esquinas redondeadas y fondo translúcido.
- Gráficos: sin cuadrículas pesadas, colores del sistema (azul, verde, naranja), barras/anillos con esquinas redondeadas, tooltips minimalistas.

*Movimiento*
- Transiciones de 150–250 ms con curva `cubic-bezier(0.2, 0.8, 0.2, 1)`; evitar rebotes exagerados.
- Hover con elevación o cambio de fondo leve; `:active` con escala 0.98.
- El resaltado de cambios en tiempo real es un pulso suave del borde o fondo (~1.5 s), nunca un parpadeo.
- Respetar `prefers-reduced-motion`: sin animaciones no esenciales.
- Usar CSS/Tailwind para el movimiento; no agregar librerías de animación sin pedir confirmación.

*Responsive y accesibilidad*
- Mobile first. Grid de tarjetas: 1 columna en móvil, 2 en tablet, 3–4 en escritorio. Layout con max-width centrado.
- Zonas táctiles de al menos 44×44px, contraste AA como mínimo en ambos temas, foco visible por teclado, `aria-label` en botones de solo ícono.
- Íconos: set único de trazo fino y consistente (lucide-react), tamaño 18–20px.

*Regla para el agente:* antes de crear un componente nuevo, revisa los tokens y componentes existentes y reutilízalos. Prohibido usar el aspecto por defecto de Tailwind o de librerías de UI sin ajustarlo a estos tokens.

**Cliente HTTP**
- `fetch` con `credentials: 'include'`. Un único `httpClient` en `lib/`. Ante un 401, limpiar la sesión y redirigir a `/login`.
- En desarrollo, Vite hace proxy de `/api/*` a la API reescribiendo el prefijo (`/api/vms` → `/vms`), así front y API son mismo origen y la cookie `SameSite=Strict` funciona sin fricción.

## 10. Variables de entorno (`.env.example`)

```
# apps/api
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://vmuser:vmpass@localhost:5432/vmdb
JWT_SECRET=cambia-esto-por-un-secreto-largo-de-al-menos-32-caracteres
JWT_EXPIRES_IN=1h
CORS_ORIGIN=http://localhost:5173
COOKIE_SAMESITE=strict

# apps/web
VITE_API_BASE=/api
```

## 11. Plan por fases (detenerse al final de cada una)

**Fase 0 — Andamiaje.** Monorepo pnpm, `tsconfig` estrictos, ESLint + Prettier, `docker-compose.yml` con PostgreSQL, `packages/shared` con enums y esquemas zod, `.env.example`, scripts raíz (`dev`, `db:up`, `db:migrate`, `db:seed`, `test`, `lint`).

**Fase 1 — API base y auth.** Esquema Prisma + migración, seed (1 ADMIN y 1 CLIENT), config con env validado, `POST /login`, `POST /logout`, `GET /me`, cookie HttpOnly/Secure/SameSite, middleware `authenticate` y `requireRole`, rate limit en login, helmet y CORS. Tests de auth y roles.

**Fase 2 — CRUD de VMs.** Endpoints `/vms` con validación zod, errores uniformes, 409 en nombre duplicado, autorización por rol. Tests de permisos (CLIENT recibe 403 en mutaciones).

**Fase 3 — Frontend base.** Vite + Tailwind + dark mode, layout, router con guards, `httpClient`, store de sesión (Zustand), página de login, restauración de sesión con `/me`.

**Fase 4 — VMs en el front.** Listado con skeletons y empty state, formulario con validación en tiempo real, mutaciones con optimistic UI y rollback, toasts, `<Can>`, diálogo de confirmación al eliminar.

**Fase 5 — Dashboard.** Tarjetas de resumen y gráficos Recharts de recursos asignados de VMs activas, con skeleton y empty state.

**Fase 6 — Realtime.** socket.io en servidor con auth por cookie, eventos, hook `useVmRealtime`, animación de resaltado.

**Fase 7 — Pulido y documentación.** Revisión visual (responsive, dark/light), accesibilidad básica, `README.md` (guía de despliegue local paso a paso, credenciales de prueba, diagrama, decisiones arquitectónicas y estructura de carpetas, sección "Bitácora de IA" tomada de `docs/AI_LOG.md`).
*Optimización de bundle (pendiente D3-5):* el build de Vite avisa de un chunk mayor a 500 KB. Aplicar code splitting: cargar las páginas con `React.lazy` + `Suspense` (con skeleton como fallback) y separar dependencias pesadas (Recharts, socket.io-client) con `manualChunks` en `vite.config`. Mostrar el tamaño de los chunks antes y después del build. Hacerlo solo en esta fase, cuando el frontend ya esté completo, para medir el bundle real.

## 12. Bitácora de IA (obligatoria)

Mantén `docs/AI_LOG.md` con una entrada por fase usando esta plantilla:

```md
## Fase N — <título>
- **Herramienta:** opencode + <modelo usado>
- **Delegado a la IA:** <qué generó el agente>
- **Intervención de Carlos Eduardo (Intervención humana):**
- **Prompt clave (opcional):** <prompt usado, si fue relevante>
```

Reglas: no exageres ni embellezcas lo que hizo la IA; describe con honestidad. La sección "Intervención de Carlos" la escribe Carlos, no el agente.

## 13. Definición de terminado

- La UI usa solo los tokens de diseño definidos (colores, radios, tipografía) y se ve consistente en light y dark, en móvil y escritorio.
- `pnpm install && pnpm db:up && pnpm db:migrate && pnpm db:seed && pnpm dev` levanta todo desde cero.
- Credenciales de prueba documentadas: `admin@ifx.test / Admin123!` y `client@ifx.test / Client123!`.
- El token no aparece en ningún body de respuesta ni en `localStorage`/`sessionStorage`.
- Un CLIENT no ve los botones de crear/editar/eliminar y la API le responde 403 en esas rutas.
- El optimistic UI revierte correctamente cuando la API falla.
- El cambio de estado de una VM hecho por un ADMIN se refleja y resalta en otros clientes conectados.
- `pnpm lint` y `pnpm test` pasan.
- El build de producción del frontend no muestra la advertencia de chunks mayores a 500 KB.
