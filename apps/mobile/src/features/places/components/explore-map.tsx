import { formatScore } from '@crumbz/shared';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { Linking, Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

import type { ExplorePlace } from '../queries';

/**
 * Free OpenStreetMap vector tiles (OpenFreeMap): no account, key or billing, so Venezuela
 * isn't blocked by a provider. Attribution stays visible, as the OSM licence requires.
 * Positron/dark are quiet, near-monochrome styles that let our ink pins lead.
 */
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

const CARACAS: [number, number] = [-66.87, 10.49];
const OSM_COPYRIGHT = 'https://www.openstreetmap.org/copyright';

type Props = {
  places: ExplorePlace[];
  me: { lat: number; lng: number } | null;
  onOpen: (slug: string) => void;
};

/**
 * Explore map: one ink pin per place with its score, and you when "Cerca de mí" is on.
 * TODO(scale): view-based markers cost a native view each; past ~100 pins switch to a
 * GeoJSONSource + symbol layer.
 */
export function ExploreMap({ places, me, onOpen }: Props) {
  const c = useColors();
  const dark = useColorScheme() === 'dark';
  const camera = useRef<CameraRef>(null);
  const located = places.filter((p) => p.lat != null && p.lng != null);
  const view = frameFor(me, located);

  // The map must always show the places the list is talking about. On mount the view
  // goes in as initialViewState (the camera isn't ready for commands yet); afterwards
  // every filter or "Cerca de mí" change animates to the new frame.
  const frameKey = `${me ? `${me.lat},${me.lng}` : 'all'}|${located.map((p) => p.id).join(',')}`;
  const mounted = useRef(false);
  useEffect(() => {
    const cam = camera.current;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!cam) return;
    // Camera methods return promises: never return them from the effect (React expects
    // a cleanup function or nothing).
    if ('bounds' in view) void cam.fitBounds(view.bounds, { padding: view.padding, duration: 600 });
    else void cam.flyTo({ center: view.center, zoom: view.zoom, duration: 600 });
    // frameKey captures everything that should trigger a re-frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  return (
    <View style={styles.map}>
      <Map
        style={styles.map}
        mapStyle={dark ? STYLE_DARK : STYLE_LIGHT}
        logo={false}
        compass={false}
        touchRotate={false}
        touchPitch={false}
        // The built-in attribution is a teal "i": ours below keeps the licence in stone.
        attribution={false}
      >
        <Camera ref={camera} initialViewState={view} />

        {/* Android markers are native views that don't hand touches to an inner
          Pressable: the press goes through the Marker. The list below is the
          screen-reader path to the same places. */}
        {located.map((p) => (
          <Marker
            key={p.id}
            id={p.id}
            lngLat={[p.lng!, p.lat!]}
            anchor="bottom"
            onPress={() => onOpen(p.slug)}
          >
            {/* Transparent 44×44 hit area; the visible pin sits at its bottom. */}
            <View
              accessibilityLabel={
                p.avg_rating != null
                  ? `${p.name}, puntaje ${formatScore(Number(p.avg_rating))}`
                  : p.name
              }
              style={styles.pinHit}
            >
              <View style={[styles.pin, { backgroundColor: c.surfaceRaised, borderColor: c.text }]}>
                <Text variant="labelStrong" tabular>
                  {p.avg_rating != null ? formatScore(Number(p.avg_rating)) : '·'}
                </Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* You: a ringed dot in a soft halo, so it never reads as a pin's tip. Drawn
          as map layers, not a Marker: GL layers always sit under the view markers,
          so a place you're standing at keeps its score visible. (The list says
          "cerca de ti" for screen readers.) */}
        {me ? (
          <GeoJSONSource
            id="me"
            data={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [me.lng, me.lat] },
              properties: {},
            }}
          >
            <Layer
              type="circle"
              id="me-halo"
              paint={{ 'circle-radius': 16, 'circle-color': String(c.pressed) }}
            />
            <Layer
              type="circle"
              id="me-ring"
              paint={{
                'circle-radius': 9,
                'circle-color': String(c.background),
                'circle-stroke-width': 2,
                'circle-stroke-color': String(c.text),
              }}
            />
            <Layer
              type="circle"
              id="me-dot"
              paint={{ 'circle-radius': 4, 'circle-color': String(c.text) }}
            />
          </GeoJSONSource>
        ) : null}
      </Map>

      {/* OSM licence: attribution must stay visible and link to the copyright page. */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Datos del mapa de OpenStreetMap"
        onPress={() => void Linking.openURL(OSM_COPYRIGHT)}
        style={[styles.attribution, { backgroundColor: c.background }]}
      >
        <Text variant="label" tone="textMuted">
          © OpenStreetMap
        </Text>
      </Pressable>
    </View>
  );
}

const FRAME_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

type Frame =
  | { center: [number, number]; zoom: number }
  | { bounds: [number, number, number, number]; padding: typeof FRAME_PADDING };

/** Where the camera should look: you, the one place, all the places, or Caracas. */
function frameFor(me: Props['me'], located: ExplorePlace[]): Frame {
  if (me) return { center: [me.lng, me.lat], zoom: 14 };
  if (located.length === 0) return { center: CARACAS, zoom: 12 };
  if (located.length === 1) return { center: [located[0]!.lng!, located[0]!.lat!], zoom: 15 };
  const lngs = located.map((p) => p.lng!);
  const lats = located.map((p) => p.lat!);
  return {
    bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
    padding: FRAME_PADDING,
  };
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  attribution: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    opacity: 0.85,
    borderTopLeftRadius: radius.sm,
  },
  pinHit: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pin: {
    minWidth: 36,
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
  },
});
