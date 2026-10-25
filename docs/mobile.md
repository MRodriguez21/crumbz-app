# App móvil (Expo)

## ¿Qué es Expo?

Expo es un conjunto de herramientas sobre React Native. Escribimos la app una sola vez en TypeScript/React y Expo la convierte en una app nativa de Android y de iPhone. También compila en la nube (EAS Build), sube a las tiendas (EAS Submit) y permite publicar correcciones sin pasar por revisión (EAS Update).

## Expo Go: probar en tu teléfono sin compilar

**Expo Go** es una app gratuita (Play Store / App Store) que ya trae incluidos los módulos nativos más comunes de Expo. Con ella puedes ver la app de crumbz en tu teléfono real **mientras la desarrollas**, sin compilar un APK ni usar Android Studio o Xcode.

Cómo funciona:

1. En la computadora, `pnpm --filter mobile start` arranca **Metro**, un servidor que empaqueta el código JavaScript.
2. La terminal muestra un **código QR**. Ese QR solo contiene la dirección de tu computadora en la red local (algo como `exp://192.168.1.10:8081`).
3. Al escanearlo, Expo Go se conecta a esa dirección, descarga el código y lo ejecuta.
4. Cada vez que guardas un archivo, el cambio aparece en el teléfono en uno o dos segundos (_fast refresh_).

Requisitos: misma red Wi‑Fi (o `--tunnel` si la red lo impide) y una versión de Expo Go compatible con el SDK del proyecto (58).

### Límites de Expo Go

Expo Go solo incluye los módulos nativos que vienen con él. Cuando agreguemos librerías con código nativo propio (por ejemplo, el inicio de sesión con Google o Apple en la fase 1), necesitaremos un **development build**: una versión de "Expo Go" hecha a la medida de crumbz.

```bash
npx eas-cli@latest build --profile development --platform android
```

Se instala una vez en el teléfono y se usa igual que Expo Go (escaneando el QR). Se vuelve a compilar solo cuando cambian dependencias nativas.

## Estructura

```
apps/mobile/
├── app.config.ts        # nombre, identificador (com.getcrumbz.app), íconos, plugins
├── src/app/             # rutas (Expo Router): cada archivo es una pantalla
├── src/features/        # código por funcionalidad
├── src/components/      # componentes reutilizables
├── src/hooks/
└── src/lib/             # supabase, queryClient, env
```

## Reglas

- Instala paquetes con `npx expo install <paquete>` desde `apps/mobile` (elige la versión compatible con el SDK).
- No edites carpetas `android/` ni `ios/`: se generan solas. La configuración nativa va en `app.config.ts`.
- Solo iPhone (sin iPad) en el MVP.
- Antes de cambiar APIs de Expo, consulta la documentación de la versión del SDK (`apps/mobile/AGENTS.md`).
- Diagnóstico: `pnpm --filter mobile doctor`.

## Builds y publicación

Ver [`CLAUDE.md` §12](../CLAUDE.md) (tiendas) y la fase 9 de la hoja de ruta.
