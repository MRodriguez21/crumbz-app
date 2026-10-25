# Decisiones técnicas

Registro breve de decisiones que no son obvias leyendo el código. Agrega una entrada nueva arriba cuando tomes una decisión de arquitectura.

---

### 2026-10-25 — Fase 0

- **Supabase en la nube, sin Docker local.** Un solo proyecto de desarrollo (`Crumbz`). Producción será otro proyecto, sin MCP.
- **Identificador `com.getcrumbz.app`**, derivado del dominio `getcrumbz.com`. Es permanente una vez publicada la app.
- **Identidad en `app-identity.json`.** `app.config.ts` de Expo se ejecuta en Node puro y no puede importar TypeScript de otro paquete; el JSON sí se puede leer desde ambos lados.
- **TypeScript 6.0 y ESLint 9**, no las últimas mayores: typescript-eslint y las configuraciones de Expo/Next todavía no soportan TS 7 ni ESLint 10.
- **`nodeLinker: hoisted`** en pnpm: evita problemas de resolución de Metro con dependencias nativas en el monorepo.
- **Llaves nuevas de Supabase:** _publishable_ en las apps y _secret_ solo en servidor. Las variables se llaman `*_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`.
- **Corrección de seguridad del esquema:** el `revoke update (columna)` original no protegía los contadores. Se reemplazó por `revoke` de tabla + `grant` por columna.
- **Migraciones con nombre por timestamp** (formato por defecto de la CLI). Las tres primeras se aplicaron vía MCP porque la red bloqueaba la conexión directa de la CLI; los archivos se renombraron para coincidir con el historial remoto.
- **Precios:** los montos enteros se muestran sin decimales (`$12`) y los fraccionarios siempre con dos (`$12,50`).
