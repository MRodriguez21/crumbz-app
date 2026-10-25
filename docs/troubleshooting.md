# Solución de problemas

## `supabase db push` se queda en "Initialising login role…"

**Causa:** la CLI necesita conexión directa a Postgres (`aws-0-us-east-1.pooler.supabase.com`, puertos 5432/6543). Algunas redes o proveedores de internet dejan abrir la conexión TCP pero cortan el protocolo de Postgres. Con `--debug` verás `failed to connect to postgres … Connection timed out`.

**Opciones:**

1. Probar desde otra red (datos móviles compartidos, otra Wi‑Fi o una VPN).
2. Plan B con el MCP de Supabase (Claude Code):
   1. Aplicar el **mismo SQL** del archivo con `apply_migration`.
   2. Ver la versión asignada con `list_migrations`.
   3. Renombrar el archivo local a `<version>_<nombre>.sql`.

Los comandos que usan la API HTTP (`pnpm db:types`, `supabase link`) no se ven afectados.

## `npx expo install` se queda colgado

Pasa a veces cuando hay una pregunta interactiva oculta. Revisa si ya actualizó `apps/mobile/package.json`; si es así, cancela (Ctrl+C) y ejecuta `pnpm install` en la raíz.

## Expo Go dice que el proyecto usa un SDK incompatible

Actualiza Expo Go desde la tienda. Si la versión de la tienda aún no soporta el SDK del proyecto, usa un _development build_ (ver [App móvil](mobile.md)).

## El teléfono no conecta al escanear el QR

- Verifica que estén en la misma red Wi‑Fi.
- Redes corporativas o de hoteles suelen aislar dispositivos: usa `pnpm --filter mobile start --tunnel`.
- Revisa el firewall de Windows para Node.js (puerto 8081).

## Error de Zod al arrancar una app

Falta o está mal una variable de entorno. El mensaje dice cuál. Revisa `apps/<app>/.env.local` contra [`.env.example`](../.env.example) y reinicia el servidor (las variables se leen al arrancar).

## Error "Cannot find module" en `app.config.ts`

`app.config.ts` corre en Node sin compilar TypeScript de otros paquetes. Importa solo archivos JSON o JS desde `packages/` (por eso existe `app-identity.json`).
