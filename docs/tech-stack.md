# Stack tecnológico

Versiones instaladas en la fase 0 (octubre 2026). Las exactas están en `pnpm-lock.yaml`.

| Capa               | Tecnología                   | Versión                                | Por qué                                                                                  |
| ------------------ | ---------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Lenguaje           | TypeScript (strict)          | 6.0                                    | Tipos en todo el monorepo. No usamos la 7.0 todavía: typescript-eslint aún no la soporta |
| Gestor de paquetes | pnpm                         | 11                                     | Rápido y con workspaces. `nodeLinker: hoisted` para que Metro resuelva bien los paquetes |
| Monorepo           | Turborepo                    | 2.11                                   | Ejecuta `dev`, `typecheck`, `lint`, `test` en todos los paquetes con caché               |
| App móvil          | Expo + Expo Router           | SDK 58 (React Native 0.88, React 19.3) | Un código para Android e iPhone; builds en la nube (EAS); actualizaciones OTA            |
| Web                | Next.js (App Router)         | 16.4                                   | SEO y vistas previas para compartir por WhatsApp                                         |
| Estilos web        | Tailwind CSS                 | 4.3                                    |                                                                                          |
| Backend            | Supabase                     | —                                      | Postgres administrado, Auth, Storage y Edge Functions en un solo servicio                |
| Base de datos      | PostgreSQL + PostGIS         | 17                                     | Consultas geográficas ("cerca de mí") con índices GiST                                   |
| Cliente de datos   | supabase-js + TanStack Query | 2.118 / 5.104                          | Caché, reintentos y estados de carga                                                     |
| Validación         | Zod                          | 4.6                                    | Mismos esquemas en cliente, web y Edge Functions                                         |
| Tests              | Vitest                       | 5.0                                    | Lógica crítica (formato, cola offline, rankings)                                         |
| Calidad            | ESLint 9 + Prettier 3        |                                        | ESLint 10 todavía no es compatible con las configuraciones de Expo y Next                |

## Pendientes de incorporar (según fase)

| Tecnología                        | Fase     | Uso                                             |
| --------------------------------- | -------- | ----------------------------------------------- |
| FlashList                         | 4        | Listas largas fluidas en teléfonos de gama baja |
| expo-image-manipulator            | 3        | Comprimir fotos antes de subirlas               |
| PostHog                           | 1–4      | Analítica (eventos en `CLAUDE.md` §10)          |
| Google Places (vía Edge Function) | 2        | Búsqueda de lugares                             |
| Expo Notifications                | opcional | Push básico                                     |
| Cloudflare R2                     | post‑MVP | Fotos sin costo de transferencia                |

## Reglas para agregar dependencias

- Evita dependencias pesadas: la app debe correr bien en Android modestos con datos caros.
- En la app móvil, instala con `npx expo install <paquete>` (desde `apps/mobile`) para obtener la versión compatible con el SDK.
- Antes de adoptar un proveedor externo, verifica que funcione para cuentas/usuarios en Venezuela (sanciones y restricciones).
