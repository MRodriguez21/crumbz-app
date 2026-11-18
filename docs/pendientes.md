# Bitácora de pendientes

Lo que quedó por hacer y por qué. Se actualiza al cerrar cada fase: lo resuelto pasa a «Cerrados» con su fecha, lo nuevo entra en su grupo. Los `TODO(fase-N)` del código apuntan a estas mismas tareas.

Última revisión: 2026-11-18 (Fase 4).

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
| 5    | Elegir la ubicación en el mapa al crear un lugar (hoy solo con el GPS del teléfono, hay que estar ahí)                                       |
| 5    | Analítica con PostHog: `search_performed`, `whatsapp_clicked`, `instagram_clicked`, `place_viewed` (falta la clave y el cliente)             |
| 8    | Enlaces a Términos y Privacidad en el inicio de sesión (el texto ya los menciona). **Obligatorio antes de la prueba cerrada de Google Play** |
| 8    | Compartir la URL web del lugar en vez de solo el nombre                                                                                      |
| 9    | Revisar en un iPhone real que todos los textos de permisos salgan en español                                                                 |

## Verificación pendiente (no es código nuevo)

- **Cámara la primera vez:** al conceder el permiso de cámara, la primera foto no llegó al formulario (las siguientes sí). Revisar en un teléfono real; si se repite, reintentar la toma tras conceder el permiso.
- **Descartar una visita fallida:** probado en la lógica (tests), falta verlo en el emulador forzando un error permanente.
- **iPhone:** confirmar que las fotos en JPEG se comprimen y suben bien.

- Capturas de las pantallas de lugares y de Explorar en modo oscuro (mapa con estilo oscuro) y con letra grande (1,3×).
- «Cómo llegar»: comprobar que abre Google Maps en Android y Apple Maps en iPhone con la ubicación correcta.
- Ver en el emulador la búsqueda con resultados y el aviso «¿Es alguno de estos?».
- Probar en el emulador que reintentar «Crear lugar» no duplica (probado en la base, no en la app).

Se hacen en la próxima sesión con el emulador.

## Después del MVP

- Al cerrar sesión, las visitas pendientes de esa cuenta quedan en el teléfono (no se borran para no perderlas) y se publican cuando esa cuenta vuelva a entrar. Falta decidir qué hacer si nunca vuelve.
- Editar o borrar una visita publicada desde la app.

- Que quien creó un lugar pueda corregir sus datos (hoy solo los administradores).
- Lugares con local sin ubicación exacta (hoy la ubicación es obligatoria si atiende en el local).

- Explorar con muchos lugares: pasar los pines a una capa GeoJSON del mapa (pasados ~100) y la lista a FlashList (`TODO(scale)` en el código).

## Limpieza menor

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` en `apps/mobile/.env.local` no se usa; se puede borrar.
- En la cuenta de Expo puede quedar un proyecto sobrante (`adcc045d…`) creado por error; se puede eliminar.

## Cerrados

| Fecha      | Pendiente                                                                      | Cómo se cerró                                                                                         |
| ---------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 2026-11-18 | Puntaje, gasto, pagos y estacionamiento desde las visitas; sin fila de planta  | `place_summary`: puntaje con la última visita de cada persona, gasto de los últimos 12 meses          |
| 2026-11-18 | Fotos reales y platos más recomendados en la página del lugar                  | Fase 4, probado en el emulador                                                                        |
| 2026-11-18 | «Cómo llegar» y proveedor de mapas                                             | MapLibre + OpenFreeMap (sin cuenta ni tarjeta); «Cómo llegar» abre la app de mapas del teléfono       |
| 2026-11-18 | Probar la Fase 4 en el emulador                                                | Pestañas, Explorar (mapa, lista, cerca de mí, zona, categoría, pines) y página del lugar              |
| 2026-11-18 | Explorar ordenaba por promedio simple (un solo 10 ganaba)                      | Orden por promedio bayesiano (`…_explore_bayesian_order`)                                             |
| 2026-11-18 | «Cerca de mí» fallaba si se rechazaba la precisión de Google                   | Reintento directo al GPS y, si no, la última ubicación de los últimos 5 minutos                       |
| 2026-11-14 | Probar la Fase 3 en el emulador                                                | Publicada con foto, plato y datos prácticos; sin conexión + cierre forzado: se publicó sola al volver |
| 2026-11-14 | Conectar «Publicar visita» y «¿Dónde comiste?» en Inicio                       | Fase 3                                                                                                |
| 2026-11-14 | Que las visitas reporten pagos y estacionamiento                               | Bloque opcional «Lo práctico» (sin planta, decisión del fundador)                                     |
| 2026-11-14 | Lugar duplicado al reintentar con mala conexión                                | `create_place` recibe un id de solicitud y devuelve el mismo lugar; la app reintenta sola             |
| 2026-11-14 | Textos de permisos de iOS en inglés (ubicación precisa, movimiento, micrófono) | Texto en español; se quitaron los permisos de movimiento y micrófono, que no se usan                  |
| 2026-11-14 | Zonas de otra ciudad si cambiaba la ciudad con el formulario abierto           | El formulario se reinicia al cambiar la ciudad; el servidor ya lo validaba                            |
| 2026-11-11 | Diálogo de «Cerrar sesión» con colores de Android                              | Diálogo propio (`ConfirmDialog`)                                                                      |
| 2026-11-11 | Cualquier usuario podía insertar lugares saltándose las reglas                 | Lugares solo vía funciones (`…_places_harden`)                                                        |
