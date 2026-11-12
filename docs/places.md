# Lugares

Buscar un lugar, crearlo a mano o traerlo desde Google Places. Es la base de «publicar una visita» (fase 3): antes de contar cómo te fue, hay que saber dónde.

## Flujo en la app

1. **Buscar** (`/add-place`): primero el catálogo de crumbz (`search_places`), debajo los resultados de Google (si están activos) y al final «¿No aparece? Créalo».
2. **Elegir un resultado de Google**: la Edge Function `places` trae los datos y crea el lugar (o devuelve el que ya existía con ese `google_place_id`). Se abre su página.
3. **Crear a mano** (`/add-place/new`): nombre, tipo, categorías (hasta 3), formas de atender, ubicación (si atiende en el local), zonas de delivery y contacto. Avisa de lugares parecidos sin bloquear.
4. **Página del lugar** (`/place/[slug]`): datos reales; puntaje, gasto, pagos, planta y estacionamiento aparecen como «sin datos aún» hasta que haya visitas.

Reglas de validación (compartidas en `packages/shared/src/schemas/place.ts`, con tests):

| Regla                                      | Mensaje                                                           |
| ------------------------------------------ | ----------------------------------------------------------------- |
| Si atiende en el local, necesita ubicación | «Si atiende en el local, necesitamos su ubicación.»               |
| Si hace delivery, al menos una zona        | «Elige al menos una zona donde hace delivery.»                    |
| Sin local, WhatsApp o Instagram            | «Sin local, agrega WhatsApp o Instagram para que puedan pedirle.» |
| Ubicación dentro de Venezuela              | «Esa ubicación está fuera de Venezuela.»                          |
| Entre 1 y 3 categorías                     | «Elige al menos una categoría.» / «Elige máximo 3 categorías.»    |

WhatsApp se guarda en formato internacional (`0412-123.45.67` → `+584121234567`) e Instagram como usuario en minúsculas sin `@`.

## Ubicación

- **Del teléfono** (`expo-location`, solo en primer plano): «Usar mi ubicación actual». Requiere el _development build_ que incluye el módulo; en builds viejos la app muestra un mensaje en vez de fallar.
- **De Google**: viene con el lugar importado. Por los términos de Google, `location_fetched_at` marca cuándo se obtuvo y hay que refrescarla antes de 30 días (tarea pendiente, ver abajo).

## Activar Google Places

Mientras no haya clave, todo lo demás funciona y la sección «En Google» no aparece.

1. En Google Cloud (proyecto personal), activa la facturación y la API **Places API (New)**.
2. Crea una clave de API y **restríngela** solo a «Places API (New)». No le pongas restricción de app: la usa el servidor, no el teléfono.
   Pon también un **límite diario de cuota** (APIs y servicios → Places API (New) → Cuotas): la función todavía no limita llamadas por usuario.
3. Guárdala como secreto de Edge Functions (no en el repo, no en el `.env` de la app):

   ```bash
   pnpm supabase secrets set GOOGLE_PLACES_API_KEY=<tu-clave> --project-ref uxtklaqrfpjtyirogbqn
   ```

   No hace falta volver a desplegar la función: los secretos están disponibles de inmediato.

4. Prueba en la app: busca un lugar conocido de Caracas; debe aparecer la sección «En Google».

Pendiente al activar: tarea programada (pg_cron + Edge Function) que refresca las coordenadas de los lugares de Google con `location_fetched_at` de más de 25 días.

## Edge Function `places`

`supabase/functions/places/index.ts`. Valida la sesión del usuario en el código (`verify_jwt = false`, ver [decisiones](decisions.md)).

| Acción   | Entrada                                   | Respuesta                                           |
| -------- | ----------------------------------------- | --------------------------------------------------- |
| `search` | `input`, `sessionToken`, `lat?`, `lng?`   | `suggestions[]` con `existing` si ya está en crumbz |
| `import` | `googlePlaceId`, `sessionToken`, `cityId` | `{ slug, created }`                                 |

Errores: `401 unauthorized`, `400 invalid_request`, `503 google_not_configured`, `502 google_failed`.

Desplegar cambios: `pnpm supabase functions deploy places --project-ref uxtklaqrfpjtyirogbqn` (o el MCP en desarrollo).
