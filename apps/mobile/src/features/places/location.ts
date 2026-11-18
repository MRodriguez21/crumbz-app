import { isInVenezuela } from '@crumbz/shared';

export type Coords = { lat: number; lng: number; accuracy: number | null };

export type LocationResult =
  { ok: true; coords: Coords } | { ok: false; message: string; canOpenSettings?: boolean };

type ExpoLocation = typeof import('expo-location');

/** A fallback fix older than this may be from another part of the city. */
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

/** Whether Android's "turn on Location Accuracy" prompt was already shown this session. */
let askedForSettings = false;

/**
 * Loaded lazily: dev builds made before expo-location was added don't have the
 * native module, and a top-level import would crash every screen that imports this.
 */
function loadLocation(): ExpoLocation | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-location') as ExpoLocation;
  } catch {
    return null;
  }
}

/** One-shot foreground fix for "Usar mi ubicación actual". Never asks for background access. */
export async function getCurrentLocation(): Promise<LocationResult> {
  const Location = loadLocation();
  if (!Location) {
    return { ok: false, message: 'Esta versión de la app no puede leer tu ubicación todavía.' };
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    return {
      ok: false,
      message: 'Necesitamos permiso de ubicación para saber dónde estás.',
      canOpenSettings: !permission.canAskAgain,
    };
  }

  try {
    // On Android, declining Google's "Location Accuracy" prompt rejects the request
    // outright even though the GPS works: retry straight to the GPS without the prompt,
    // and as a last resort take a recent last-known position (the caller sees its accuracy).
    // Google's settings prompt at most once per app session: asking on every tap after
    // a "No thanks" is nagging, and the GPS works without it.
    const mayAsk = !askedForSettings;
    askedForSettings = true;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: mayAsk,
    })
      .catch(() =>
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: false,
        }),
      )
      .catch(async (error: unknown) => {
        const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
        if (!last) throw error;
        return last;
      });
    const coords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
    };
    if (!isInVenezuela(coords)) {
      return { ok: false, message: 'Tu ubicación está fuera de Venezuela.' };
    }
    return { ok: true, coords };
  } catch {
    return {
      ok: false,
      message: 'No pudimos leer tu ubicación. Revisa que el GPS esté activo e inténtalo de nuevo.',
    };
  }
}
