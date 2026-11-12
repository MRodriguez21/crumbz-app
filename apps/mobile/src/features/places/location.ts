import { isInVenezuela } from '@crumbz/shared';

export type Coords = { lat: number; lng: number; accuracy: number | null };

export type LocationResult =
  { ok: true; coords: Coords } | { ok: false; message: string; canOpenSettings?: boolean };

type ExpoLocation = typeof import('expo-location');

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
      message: 'Necesitamos permiso de ubicación para guardar dónde queda el lugar.',
      canOpenSettings: !permission.canAskAgain,
    };
  }

  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
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
