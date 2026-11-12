# Base de datos

Supabase (Postgres 17 + PostGIS). Proyecto de desarrollo: **Crumbz** (`uxtklaqrfpjtyirogbqn`, East US).

## Esquema

La visita (`posts`) es la unidad central. Tablas principales:

| Grupo     | Tablas                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Geografía | `cities`, `areas`                                                      |
| Usuarios  | `profiles` (ligado a `auth.users`), `admins`                           |
| Lugares   | `places`, `tags`, `place_tags`, `place_service_areas`, `place_members` |
| Contenido | `dishes`, `posts`, `post_dishes`, `post_photos`                        |
| Listas    | `lists`, `list_items`, `saves` ("quiero ir")                           |
| Social    | `follows`, `post_likes`                                                |
| Seguridad | `blocks`, `reports`                                                    |
| Rankings  | `place_rankings` (vista materializada, promedio bayesiano)             |

Funciones RPC: `places_nearby(lat, lng, radius_m, max_results)`, `top_places(city_id, tag_slug, min_raters, max_results)`, `search_places(q, city_id, max_results)` y `create_place(...)` (ver [Lugares](places.md)). `import_google_place(...)` solo la ejecuta la Edge Function `places`.

Detalle completo: [`CLAUDE.md` §8](../CLAUDE.md) y las migraciones.

## Migraciones

`supabase/migrations/` es la **fuente de verdad**. Reglas:

1. Nunca edites una migración ya aplicada; crea una nueva.
2. Después de cada cambio de esquema: `pnpm db:types` y commit del archivo de tipos.
3. Revisa los _advisors_ de seguridad y rendimiento (panel de Supabase → Advisors, o el MCP).

```bash
pnpm supabase migration new <nombre>   # crea supabase/migrations/<timestamp>_<nombre>.sql
# …escribe el SQL…
pnpm db:push                           # aplica al proyecto enlazado
pnpm db:types                          # regenera los tipos
```

Si `db:push` se queda colgado en "Initialising login role…", ver [Solución de problemas](troubleshooting.md#supabase-db-push-se-queda-en-initialising-login-role).

### Historial actual

| Migración                                 | Qué hace                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `20261025184418_schema_mvp`               | Esquema completo del MVP (tablas, índices, triggers, RLS, rankings, datos base)           |
| `20261025184425_column_update_privileges` | Corrige la protección de contadores (ver abajo)                                           |
| `20261025184454_harden_functions`         | `search_path` fijo en funciones; las funciones de trigger dejan de ser invocables por RPC |
| `20261111024542_rls_performance`          | Políticas RLS con `(select auth.uid())`, sin solapamientos, e índices en claves foráneas  |
| `20261111024550_avatars_storage`          | Bucket público `avatars` y políticas: cada usuario escribe solo en su carpeta             |
| `20261112024349_places_functions`         | `create_place`, `import_google_place`, `search_places`, slugs y origen de la ubicación    |
| `20261112024423_places_search_unaccent`   | Búsqueda de lugares sin acentos ni mayúsculas, con índice trigram de expresión            |
| `20261112034237_places_harden`            | Lugares solo se crean vía funciones; validación en servidor y formato de contacto         |

## Seguridad (RLS)

- **Todas** las tablas tienen RLS activado. Sin política explícita, nadie lee ni escribe.
- Las apps usan la _publishable key_ (rol `anon` o `authenticated`). La _secret key_ salta RLS: solo en Edge Functions.
- Usa `(select auth.uid())` en vez de `auth.uid()` en políticas nuevas (se evalúa una vez por consulta, no por fila).

### Crear lugares

Ni `anon` ni `authenticated` pueden insertar en `places`, `place_tags` ni `place_service_areas`: solo `create_place()` (usuarios) e `import_google_place()` (Edge Function). Así nadie puede atar un `google_place_id` ajeno a un lugar falso ni saltarse las reglas.

### Contadores y columnas protegidas

Supabase da permiso de `UPDATE` sobre toda la tabla a `anon` y `authenticated`. En Postgres, `revoke update (columna)` **no** quita ese permiso de tabla. Por eso:

```sql
revoke update on table posts from anon, authenticated;
grant update (rating, body, mode, spend_per_person_usd, visited_on) on table posts to authenticated;
```

Si agregas una columna que el usuario deba poder editar en `profiles` o `posts`, agrégala al `grant` en una migración nueva. Por defecto, las columnas nuevas **no** son editables desde el cliente.

### Avisos de los advisors

- **Rendimiento:** resuelto en `…_rls_performance`. Solo queda «índice sin usar» (informativo; normal mientras no hay datos).
- **Aceptados a propósito:** `is_admin()` ejecutable por `anon`/`authenticated` (lo necesitan las políticas), `create_place()` ejecutable por `authenticated` (es _security definer_ a propósito: nadie inserta en `places` directamente y la función valida todo) y `place_rankings` expuesta en la API (son datos públicos agregados).
- **«Leaked password protection»:** no aplica; no usamos contraseñas (solo Google y Apple).

## Datos de desarrollo

`supabase/seed.sql` agrega las zonas de Caracas. Caracas y las categorías base vienen en la migración inicial.

## MCP de Supabase (Claude Code)

`.mcp.json` conecta Claude Code **solo** al proyecto de desarrollo. Sirve para inspeccionar tablas, revisar advisors, ver logs y generar tipos. Producción nunca se conecta al MCP.
