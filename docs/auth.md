# Inicio de sesión y perfil

## Cómo funciona

1. **Login nativo** → el proveedor (Google o Apple) entrega un _ID token_ → `supabase.auth.signInWithIdToken` crea la sesión de Supabase (guardada en AsyncStorage).
2. **Guardas de rutas** (`apps/mobile/src/app/_layout.tsx`, `Stack.Protected`):
   - sin sesión → `sign-in`
   - con sesión y sin fila en `profiles` → `onboarding`
   - con sesión y perfil → `(app)/…`
   - si no se puede saber si existe el perfil (sin conexión) → pantalla de reintento, nunca onboarding por error.
3. **Perfil**: se crea una sola vez (`profiles.insert` con la política «insert own profile»). El usuario es único sin distinguir mayúsculas (`citext`) y se valida con `usernameSchema` (`packages/shared/src/schemas/profile.ts`), igual que en la base.
4. **Foto de perfil**: se comprime en el teléfono (512 px, WebP 0,7) y se sube a `avatars/{user_id}/{timestamp}.webp`. `profiles.avatar_path` guarda la ruta, no la URL.

| Archivo | Qué hace |
|---|---|
| `features/auth/auth-provider.tsx` | Sesión global (`useSession`) |
| `features/auth/google.ts` | Google Sign-In nativo (carga diferida: Expo Go no se cae) |
| `features/auth/apple.ts` | Sign in with Apple (solo iPhone, con _nonce_) — listo, sin activar |
| `features/profile/queries.ts` | `useMyProfile`, disponibilidad de usuario, crear/editar |
| `features/profile/components/profile-form.tsx` | Formulario compartido de onboarding y edición |

## Expo Go vs. build de desarrollo

Google Sign-In es un módulo nativo: **no funciona en Expo Go**. Para probar el login hace falta el _development build_ (ver [App móvil](mobile.md)). Para revisar pantallas sin login, Expo Go sigue sirviendo con `npx expo start --go`.

## Configuración pendiente (una vez)

### 1. Google Cloud (Google)

1. Crear el proyecto **crumbz** en [console.cloud.google.com](https://console.cloud.google.com).
2. **Pantalla de consentimiento OAuth**: tipo _Externo_, nombre `crumbz`, correo de soporte, dominio `getcrumbz.com`.
3. **Credenciales → Crear ID de cliente OAuth**, tres veces:
   - **Web** → guarda el _Client ID_ y el _Client secret_.
   - **Android** → paquete `com.getcrumbz.app` + huella **SHA‑1** del build (la da EAS: `npx eas-cli credentials`).
   - **iOS** → bundle `com.getcrumbz.app`.
4. Variables (públicas) en `apps/mobile/.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios client id>
   ```
   y para el build de iOS, `GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.<…>` (el iOS client id al revés).

### 2. Supabase → Authentication → Providers → Google

Activar Google, pegar el **Client ID de Web** (y en _Authorized Client IDs_ los de Android e iOS) y el **Client secret** de Web.

### 3. Apple (cuando exista la cuenta de Apple Developer)

El código ya está (`features/auth/apple.ts`, `ios.usesAppleSignIn`). Falta: habilitar _Sign in with Apple_ en el App ID `com.getcrumbz.app`, activar el proveedor Apple en Supabase con ese bundle en _Client IDs_. Como es solo nativo, no requiere rotar secretos.

### 4. Storage

Aplicar `supabase/migrations/_pending_avatars_storage.sql` (bucket `avatars` + políticas) con el mismo flujo de las demás migraciones.
