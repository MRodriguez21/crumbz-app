# Arquitectura

**Monolito modular** en un monorepo: dos apps cliente, un paquete compartido y Supabase como backend. Sin microservicios ni servidores propios en el MVP.

```
┌──────────────────────┐      ┌──────────────────────┐
│  apps/mobile (Expo)  │      │  apps/web (Next.js)  │
│  Android + iPhone    │      │  Páginas públicas,   │
│  App de usuarios     │      │  SEO, Open Graph     │
└──────────┬───────────┘      └──────────┬───────────┘
           │   importan                  │
           ▼                             ▼
     ┌─────────────────────────────────────────┐
     │  packages/shared                        │
     │  config · tipos de la BD · Zod · utils  │
     └─────────────────────────────────────────┘
           │ supabase-js (publishable key)  │
           ▼                                ▼
     ┌─────────────────────────────────────────┐
     │  Supabase                               │
     │  Postgres + PostGIS · Auth · Storage ·  │
     │  Edge Functions (lógica con secretos)   │
     └─────────────────────────────────────────┘
```

## Piezas

### `apps/mobile` — Expo + Expo Router

- Rutas en `src/app/` (cada archivo es una pantalla; `_layout.tsx` define la navegación).
- Código por **feature** en `src/features/<feature>/` (auth, places, posts, lists, social, safety).
- `src/lib/`: cliente de Supabase (sesión guardada en AsyncStorage), `queryClient` de TanStack Query, validación de variables (`env.ts`). Aquí vivirá la cola de publicación offline.
- Acceso a datos siempre con hooks de TanStack Query (`usePlace`, `useCreatePost`…), nunca llamadas sueltas a Supabase dentro de componentes.

### `apps/web` — Next.js (App Router)

- Páginas públicas compartibles e indexables: lugares, perfiles, listas, privacidad, términos, eliminar cuenta.
- Tres clientes de Supabase en `src/lib/supabase/`:
  - `public.ts`: sin sesión, para lecturas públicas cacheables (la mayoría de las páginas).
  - `server.ts`: con las cookies del usuario (Server Components / Server Functions).
  - `client.ts`: para componentes de cliente.
- Cache Components activado: lo que lee cookies debe ir dentro de `<Suspense>`.

### `packages/shared`

- `app-identity.json` + `config.ts`: nombre, identificador de la app, dominio, zona horaria. **Único lugar** para cambiar la marca.
- `database.types.ts`: generado desde Supabase (`pnpm db:types`), nunca se edita a mano.
- `schemas/`: esquemas Zod usados en móvil, web y Edge Functions.
- `utils/format.ts`: precios en USD con formato venezolano (`$12,50`) y fechas en hora de Caracas.
- Se publica como TypeScript sin compilar: Metro (móvil) y Next (`transpilePackages`) lo compilan.

### `supabase/`

- `migrations/`: la fuente de verdad del esquema. Ver [Base de datos](database.md).
- `functions/`: Edge Functions (Deno) para todo lo que necesite secretos: búsqueda en Google Places, eliminación de cuenta.
- `seed.sql`: datos de desarrollo (zonas de Caracas).

## Flujos clave

- **Seguridad:** las apps solo tienen la _publishable key_. Lo que cada usuario puede leer o escribir lo decide **RLS** en Postgres. La _secret key_ solo vive en Edge Functions.
- **Rankings:** nunca se calculan en vivo. La vista materializada `place_rankings` (promedio bayesiano) se refresca cada 15 min con pg_cron.
- **Contadores** (likes, seguidores, visitas): los mantienen triggers en la base de datos; el cliente no puede escribirlos.
- **Conexión inestable:** TanStack Query reintenta con espera exponencial y guarda caché 24 h. Las publicaciones irán a una cola local que nunca descarta nada sin confirmación (fase 3).

## Dónde crecerá (y cuándo)

Notas `// TODO(scale):` en el código marcan puntos a revisar con más tráfico. Resumen en [`CLAUDE.md` §6](../CLAUDE.md): feed pre‑generado, búsqueda con Meilisearch/Typesense, fotos en Cloudflare R2, contadores por lotes.
