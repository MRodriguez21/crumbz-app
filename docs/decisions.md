# Decisiones técnicas

Registro breve de decisiones que no son obvias leyendo el código. Agrega una entrada nueva arriba cuando tomes una decisión de arquitectura.

---

### 2026-11-10 — Fase 1 (login y perfil)

- **Login nativo con `signInWithIdToken`**: Google con `@react-native-google-signin/google-signin`, Apple con `expo-apple-authentication` (con _nonce_). Requiere _development build_ (EAS); Expo Go sigue sirviendo para pantallas sin login (`expo start --go`).
- **Apple: código listo, sin activar** hasta tener la cuenta de Apple Developer (decisión del fundador). Solo nativo en iPhone; en Android solo Google.
- **Guardas con `Stack.Protected`** (Expo Router SDK 58). Si no se puede cargar el perfil, pantalla de reintento: nunca se manda a onboarding por un error de red.
- **Usuarios en minúsculas** (`usernameSchema`), únicos sin distinguir mayúsculas en la base (`citext`), con lista de reservados.
- **Fotos de perfil** comprimidas en el dispositivo (512 px, WebP) en el bucket `avatars/{user_id}/…`.
- **Rutas tipadas de Expo Router desactivadas**: el generador escanea mal este monorepo en Windows.
- **Instalación de dependencias en Windows**: pnpm 11 puede fallar con `ENOENT …_tmp_…\node_modules` al reemplazar paquetes; la salida fiable es una instalación limpia (borrar `node_modules` y `pnpm install`).

### 2026-10-25 — Fase 0.5 (identidad y design system)

- **Mundo visual «Dicho y probado»**, elegido por el fundador en la ronda de decisión de impeccable (mano atrevida): escala neutra cálida (stone) y **un solo acento verde reservado para la prueba** (conteos de personas reales, confirmaciones) y para WhatsApp. Nada se afirma sin prueba. Reglas completas en [`DESIGN.md`](../DESIGN.md); contexto de producto en [`PRODUCT.md`](../PRODUCT.md).
- **Pantalla ancla: perfil del lugar** (`apps/mobile/src/app/place/[slug].tsx`), con datos de ejemplo marcados en pantalla hasta la fase 4.
- **Tokens en `packages/ui`** (fuente única para móvil y web). La web los recibe como variables CSS `--cz-*` generadas por `tokensToCss()` y mapeadas a Tailwind.
- **Manrope en dos pesos (500/800)**, cifras tabulares; íconos con `lucide-react-native` (+ `react-native-svg`).
- **Misma identidad en Android e iPhone**, con estructura Material y garantías de iOS (glifos de volver/compartir propios, safe area).
- El componente `Text` usa `variant`/`tone` (no `role`/`color`) para no pisar la prop de accesibilidad `role` de React Native.
- Verificado en emulador Android (claro, oscuro, fuente 1,3×) y revisado por el revisor de acabado de impeccable. Sin capturas de iOS todavía.

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
