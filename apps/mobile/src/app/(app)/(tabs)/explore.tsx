import { formatDistance, formatScore } from '@crumbz/shared';

import { router, useIsFocused } from 'expo-router';
import { ChevronDown, LocateFixed, Search } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { SelectSheet } from '@/components/select-sheet';
import { Text } from '@/components/text';
import { ExploreMap } from '@/features/places/components/explore-map';
import { placeMeta } from '@/features/places/components/place-row';
import { getCurrentLocation } from '@/features/places/location';
import {
  useAreas,
  useCurrentCityId,
  useExplorePlaces,
  useTags,
  type ExplorePlace,
} from '@/features/places/queries';
import { space, touchTarget, useColors } from '@/theme';

/** Share of the screen height the map takes; the list scrolls below. */
const MAP_SHARE = 0.38;

/**
 * Explore: near me, by area, by category. Map and list show the same places; the list
 * carries the details (score, people, distance) for people who don't read maps.
 * TODO(scale): FlashList when lists grow past ~100 rows.
 */
export default function ExploreScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const cityId = useCurrentCityId();
  const focused = useIsFocused();
  const { data: areas } = useAreas(cityId);
  const { data: tags } = useTags();

  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>();
  const [areaId, setAreaId] = useState<number | null>(null);
  const [tagSlug, setTagSlug] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'area' | 'tag' | null>(null);

  const {
    data: places,
    isPending,
    isError,
    refetch,
  } = useExplorePlaces({
    cityId,
    near,
    areaId,
    tagSlug,
  });

  const toggleNear = async () => {
    setLocationError(undefined);
    if (near) return setNear(null);
    setLocating(true);
    const result = await getCurrentLocation();
    setLocating(false);
    if (result.ok) setNear({ lat: result.coords.lat, lng: result.coords.lng });
    else setLocationError(result.message);
  };

  const areaName = areas?.find((a) => a.id === areaId)?.name;
  const tagName = tags?.find((t) => t.slug === tagSlug)?.name;
  const open = (slug: string) => router.push(`/place/${slug}`);

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headline" accessibilityRole="header">
          Explorar
        </Text>
        <IconButton
          icon={Search}
          accessibilityLabel="Buscar un lugar"
          onPress={() => router.push('/add-place')}
        />
      </View>

      {/* Three fixed cells on hairlines (not chips): a long zone or category name
          truncates instead of pushing another filter off-screen. */}
      <View style={[styles.filters, { borderTopColor: c.line }]}>
        <FilterButton
          label="Cerca de mí"
          accessibilityLabel="Cerca de mí"
          icon={
            locating ? (
              <ActivityIndicator size="small" color={c.text} />
            ) : (
              <LocateFixed size={18} color={near ? c.text : c.textMuted} strokeWidth={2} />
            )
          }
          active={!!near}
          onPress={toggleNear}
        />
        <FilterButton
          label={areaName ?? 'Zona'}
          accessibilityLabel={areaName ? `Zona: ${areaName}` : 'Zona'}
          active={areaId != null}
          trailing
          divided
          onPress={() => setSheet('area')}
        />
        <FilterButton
          label={tagName ?? 'Categoría'}
          accessibilityLabel={tagName ? `Categoría: ${tagName}` : 'Categoría'}
          active={tagSlug != null}
          trailing
          divided
          onPress={() => setSheet('tag')}
        />
      </View>
      {locationError ? (
        <Text variant="label" tone="danger" style={styles.notice} accessibilityLiveRegion="polite">
          {locationError}
        </Text>
      ) : null}

      <View style={[styles.map, { height: height * MAP_SHARE, borderColor: c.line }]}>
        {/* Only while this tab is visible: a hidden GL map still renders and holds tiles. */}
        {focused ? <ExploreMap places={places ?? []} me={near} onOpen={open} /> : null}
      </View>

      <FlatList
        data={places ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text variant="labelStrong" style={styles.count} accessibilityLiveRegion="polite">
            {isPending
              ? 'Buscando lugares…'
              : `${places?.length ?? 0} ${places?.length === 1 ? 'lugar' : 'lugares'}${
                  near ? ' cerca de ti' : ''
                }`}
          </Text>
        }
        ListEmptyComponent={
          isPending ? undefined : isError ? (
            <Pressable accessibilityRole="button" onPress={() => refetch()} style={styles.empty}>
              <Text variant="bodySmall" tone="danger">
                No pudimos cargar los lugares. Toca para reintentar.
              </Text>
            </Pressable>
          ) : (
            <View style={styles.empty}>
              <Text variant="title">Nada por aquí todavía</Text>
              <Text variant="bodySmall" tone="textMuted">
                {near
                  ? 'No hay lugares registrados cerca de ti. Prueba quitando «Cerca de mí».'
                  : 'Prueba con otra zona o categoría, o agrega un lugar que conozcas.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <ExploreRow
            place={item}
            areaName={areaName}
            first={index === 0}
            onPress={() => open(item.slug)}
          />
        )}
      />

      <SelectSheet
        visible={sheet === 'area'}
        title="Zona"
        value={areaId}
        options={[
          { value: null, label: 'Todas las zonas' },
          ...(areas ?? []).map((a) => ({ value: a.id as number | null, label: a.name })),
        ]}
        onSelect={setAreaId}
        onClose={() => setSheet(null)}
      />
      <SelectSheet
        visible={sheet === 'tag'}
        title="Categoría"
        value={tagSlug}
        options={[
          { value: null, label: 'Todas las categorías' },
          ...(tags ?? []).map((t) => ({ value: t.slug as string | null, label: t.name })),
        ]}
        onSelect={setTagSlug}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

/** One filter cell: muted when idle; ink, bold and underlined when it's narrowing the list. */
function FilterButton({
  label,
  accessibilityLabel,
  icon,
  active,
  trailing,
  divided,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  icon?: ReactNode;
  active: boolean;
  trailing?: boolean;
  /** Hairline on the left, between cells. */
  divided?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      android_ripple={{ color: c.pressed }}
      style={({ pressed }) => [
        styles.filter,
        divided && { borderLeftWidth: 1, borderLeftColor: c.line },
        { borderBottomColor: active ? c.text : 'transparent' },
        pressed && { backgroundColor: c.pressed },
      ]}
    >
      {icon}
      <Text
        variant={active ? 'bodyStrong' : 'body'}
        tone={active ? 'text' : 'textMuted'}
        numberOfLines={1}
        style={styles.filterText}
      >
        {label}
      </Text>
      {trailing ? (
        <ChevronDown size={16} color={active ? c.text : c.textMuted} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

function ExploreRow({
  place,
  areaName,
  first,
  onPress,
}: {
  place: ExplorePlace;
  /** The zone filter, if any: a place outside it is listed because it delivers there. */
  areaName?: string;
  first: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const stack = useWindowDimensions().fontScale > 1.15;
  const deliversHere = !!areaName && place.area_name !== areaName;
  const meta = [
    placeMeta(place.kind, place.service_modes, place.area_name),
    deliversHere ? `llega a ${areaName}` : null,
    place.distance_m != null ? formatDistance(place.distance_m) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const rated = place.avg_rating != null && place.raters > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        place.name,
        meta,
        rated
          ? `puntaje ${formatScore(Number(place.avg_rating))}, de ${
              place.raters === 1 ? '1 persona' : `${place.raters} personas`
            }`
          : 'sin visitas',
      ].join(', ')}
      onPress={onPress}
      android_ripple={{ color: c.pressed }}
      style={({ pressed }) => [
        styles.row,
        stack && styles.rowStacked,
        !first && { borderTopWidth: 1, borderTopColor: c.line },
        pressed && { backgroundColor: c.pressed },
      ]}
    >
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={stack ? undefined : 1}>
          {place.name}
        </Text>
        <Text variant="label" tone="textMuted" tabular numberOfLines={stack ? undefined : 1}>
          {meta}
        </Text>
      </View>
      {rated ? (
        <View style={stack ? styles.scoreStacked : styles.score}>
          <Text variant="title" tabular>
            {formatScore(Number(place.avg_rating))}
          </Text>
          <Text variant="labelStrong" tone="proof" tabular>
            {place.raters === 1 ? '1 persona' : `${place.raters} personas`}
          </Text>
        </View>
      ) : (
        <Text variant="label" tone="textMuted">
          sin visitas
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.lg,
    paddingRight: space.xs,
    paddingTop: space.sm,
  },
  filters: { flexDirection: 'row', marginTop: space.md, borderTopWidth: 1 },
  filter: {
    flex: 1,
    minHeight: touchTarget + space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
    paddingHorizontal: space.xs,
    borderBottomWidth: 2,
  },
  filterText: { flexShrink: 1 },
  notice: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  map: { borderTopWidth: 1, borderBottomWidth: 1, overflow: 'hidden' },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  count: { paddingTop: space.md, paddingBottom: space.xs },
  row: {
    minHeight: touchTarget + space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: space.xs },
  rowText: { flex: 1, gap: space.xxs },
  score: { alignItems: 'flex-end' },
  scoreStacked: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  empty: { gap: space.xs, paddingVertical: space.lg },
});
