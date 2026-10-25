# Primeros pasos

## Requisitos

| Herramienta | Versión                    | Notas                                                               |
| ----------- | -------------------------- | ------------------------------------------------------------------- |
| Node.js     | 22 o superior              | `node -v`                                                           |
| pnpm        | 11                         | `npm i -g pnpm` o `corepack enable`                                 |
| Git         | cualquiera reciente        |                                                                     |
| Expo Go     | compatible con Expo SDK 58 | App gratuita en Play Store / App Store (ver [App móvil](mobile.md)) |

No hace falta Docker ni la CLI de Supabase instalada globalmente: la CLI viene como dependencia del proyecto (`pnpm supabase …`).

## 1. Instalar dependencias

```bash
pnpm install
```

## 2. Variables de entorno

Cada app tiene su propio archivo `.env.local` (no se suben al repositorio). Usa [`.env.example`](../.env.example) como plantilla:

- `apps/mobile/.env.local` → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `apps/web/.env.local` → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`

Los valores están en el panel de Supabase → **Project Settings → API Keys** (usa la _publishable key_, nunca la _secret key_ en las apps). Si falta o está mal una variable, la app falla al arrancar con un error de Zod que dice cuál.

## 3. Levantar las apps

```bash
pnpm dev                      # todo a la vez (Turborepo)
pnpm --filter web dev         # solo la web → http://localhost:3000
pnpm --filter mobile start    # solo la app móvil (Expo)
```

Para ver la app móvil en tu teléfono:

1. Instala **Expo Go** en el teléfono.
2. Teléfono y computadora en la **misma red Wi‑Fi**.
3. Ejecuta `pnpm --filter mobile start` y escanea el código QR que aparece en la terminal (Android: desde Expo Go; iPhone: con la cámara).

Si la red no deja que el teléfono vea la computadora, usa `pnpm --filter mobile start --tunnel`.

## 4. Supabase (una vez por máquina)

```bash
pnpm supabase login                                   # abre el navegador
pnpm supabase link --project-ref uxtklaqrfpjtyirogbqn # pide la contraseña de la BD
```

Después: [Base de datos](database.md) explica cómo crear y aplicar migraciones y regenerar tipos.

## 5. Antes de hacer commit

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check   # o `pnpm format` para corregir
```

Commits con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`, `fix:`, `chore:`, `docs:`…

## Comandos útiles

| Comando                       | Qué hace                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| `pnpm db:types`               | Regenera `packages/shared/src/database.types.ts` desde Supabase |
| `pnpm db:push`                | Aplica migraciones pendientes al proyecto enlazado              |
| `pnpm --filter mobile doctor` | Diagnóstico de dependencias de Expo                             |
| `pnpm --filter web build`     | Build de producción de la web                                   |
