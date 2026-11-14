# Bitácora de pendientes

Lo que quedó por hacer y por qué. Se actualiza al cerrar cada fase: lo resuelto pasa a «Cerrados» con su fecha, lo nuevo entra en su grupo. Los `TODO(fase-N)` del código apuntan a estas mismas tareas.

Última revisión: 2026-11-14.

## Bloqueados por algo externo

### Google Places (falta registrar la tarjeta en Google Cloud)

Pasos para activar: [Lugares → Activar Google Places](places.md#activar-google-places). Al tener la clave:

| Pendiente                                                                               | Por qué                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Probar de punta a punta la búsqueda y la importación desde Google                       | El código está desplegado pero nunca corrió contra la API real                    |
| Tarea programada que refresca las coordenadas de Google antes de 30 días                | Lo exigen los términos de Google (`location_fetched_at`)                          |
| Límite de llamadas por usuario en la Edge Function `places` + cuota diaria en Google    | Cualquier cuenta podría gastar la cuota paga                                      |
| Al importar, aceptar solo lugares de comida (hoy solo se valida que estén en Venezuela) | Hay que ver respuestas reales de Google para afinar los tipos sin rechazar de más |
| Acercar los resultados de Google a la ubicación del usuario                             | Hoy se centran en Caracas                                                         |

### Cuenta de Apple Developer (se compra más adelante, decisión del fundador)

- Activar «Iniciar sesión con Apple» (código listo en `features/auth/apple.ts`).
- Primer build de iOS (necesita `GOOGLE_IOS_URL_SCHEME`) y probar todas las pantallas en iPhone: botón de volver, diálogos, permisos, safe area.

## Programados en una fase

| Fase | Pendiente                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 3    | Conectar «Publicar visita» (página del lugar, perfil) y cambiar «Buscar un lugar» de Inicio por «¿Dónde comiste?»                            |
| 3    | Que las visitas reporten pagos, planta y estacionamiento (hoy la página del lugar dice «sin datos aún»)                                      |
| 4    | «Cómo llegar» en la página del lugar y elegir ubicación en un mapa (depende del proveedor de mapas)                                          |
| 4    | Fotos reales en la página del lugar (hoy hay marcadores de posición en el ejemplo)                                                           |
| 4    | Analítica con PostHog: `search_performed`, `whatsapp_clicked`, `instagram_clicked`, `place_viewed` (falta la clave y el cliente)             |
| 8    | Enlaces a Términos y Privacidad en el inicio de sesión (el texto ya los menciona). **Obligatorio antes de la prueba cerrada de Google Play** |
| 8    | Compartir la URL web del lugar en vez de solo el nombre                                                                                      |
| 9    | Revisar en un iPhone real que todos los textos de permisos salgan en español                                                                 |

## Verificación pendiente (no es código nuevo)

- Capturas de las pantallas de lugares en modo oscuro y con letra grande (1,3×).
- Ver en el emulador la búsqueda con resultados y el aviso «¿Es alguno de estos?».
- Probar en el emulador que reintentar «Crear lugar» no duplica (probado en la base, no en la app).

Se hacen al volver a levantar el emulador para la Fase 3.

## Después del MVP

- Que quien creó un lugar pueda corregir sus datos (hoy solo los administradores).
- Lugares con local sin ubicación exacta (hoy la ubicación es obligatoria si atiende en el local).

## Limpieza menor

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` en `apps/mobile/.env.local` no se usa; se puede borrar.
- En la cuenta de Expo puede quedar un proyecto sobrante (`adcc045d…`) creado por error; se puede eliminar.

## Cerrados

| Fecha      | Pendiente                                                                      | Cómo se cerró                                                                             |
| ---------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 2026-11-14 | Lugar duplicado al reintentar con mala conexión                                | `create_place` recibe un id de solicitud y devuelve el mismo lugar; la app reintenta sola |
| 2026-11-14 | Textos de permisos de iOS en inglés (ubicación precisa, movimiento, micrófono) | Texto en español; se quitaron los permisos de movimiento y micrófono, que no se usan      |
| 2026-11-14 | Zonas de otra ciudad si cambiaba la ciudad con el formulario abierto           | El formulario se reinicia al cambiar la ciudad; el servidor ya lo validaba                |
| 2026-11-11 | Diálogo de «Cerrar sesión» con colores de Android                              | Diálogo propio (`ConfirmDialog`)                                                          |
| 2026-11-11 | Cualquier usuario podía insertar lugares saltándose las reglas                 | Lugares solo vía funciones (`…_places_harden`)                                            |
