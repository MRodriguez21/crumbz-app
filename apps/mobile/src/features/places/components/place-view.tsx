import {
  PAYMENT_METHOD_LABELS,
  SERVICE_MODE_LABELS,
  SERVICE_MODES,
  formatUsdRange,
} from '@crumbz/shared';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, Navigation, Share as ShareIos, Share2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { PendingVisits } from '@/features/posts/components/pending-visits';
import { VisitRow, visitMeta } from '@/features/posts/components/visit-row';
import { photoUrl, thumbPath } from '@/features/posts/photos';
import { radius, space, touchTarget, useColors } from '@/theme';

import { usePlaceSummary, type PlaceDetail, type PlaceSummary } from '../queries';
import type { ProofFact } from '../types';
import { PhotoPlates } from './photo-plates';
import { PlaceActionBar } from './place-action-bar';
import { placeMeta } from './place-row';
import { ProofPair } from './proof-pair';
import { ScoreClaim } from './score-claim';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;
const ShareIcon = Platform.OS === 'ios' ? ShareIos : Share2;

/** Payment methods named in the claim before "y N más". */
const PAYMENTS_SHOWN = 3;

/**
 * Each fact says where it comes from: what whoever added the place stated ("sin
 * confirmar"), what visits reported (counted), or nothing yet ("sin datos aún").
 * No generator row: visits don't ask about it (founder decision, phase 3).
 */
function factsFor(place: PlaceDetail, summary: PlaceSummary | undefined): ProofFact[] {
  const modes = SERVICE_MODES.filter((m) => place.service_modes.includes(m));
  const zones = place.service_areas.map((s) => s.area?.name).filter(Boolean) as string[];
  const facts: ProofFact[] = [
    { id: 'modes', claim: modes.map((m) => SERVICE_MODE_LABELS[m]).join(' · '), status: 'stated' },
  ];
  if (zones.length > 0) {
    facts.push({
      id: 'delivery',
      claim: zones.length === 1 ? 'Delivery a 1 zona' : `Delivery a ${zones.length} zonas`,
      detail: zones.join(', '),
      status: 'stated',
    });
  }

  const spend = summary?.spend;
  facts.push(
    spend
      ? {
          id: 'spend',
          claim: formatUsdRange(Number(spend.low), Number(spend.high)),
          detail: 'por persona',
          status: 'confirmed',
          basis: 'average',
          visits: spend.visits,
        }
      : { id: 'spend', claim: 'Gasto por persona', status: 'unknown' },
  );

  const payments = summary?.payments ?? [];
  if (payments.length > 0) {
    const names = payments.slice(0, PAYMENTS_SHOWN).map((p) => PAYMENT_METHOD_LABELS[p.method]);
    const rest = payments.length - PAYMENTS_SHOWN;
    facts.push({
      id: 'payments',
      claim: names.join(', ') + (rest > 0 ? ` y ${rest} más` : ''),
      detail: 'cómo pagaron',
      status: 'confirmed',
      basis: 'reported',
      visits: summary?.payments_visits ?? 0,
    });
  } else {
    facts.push({ id: 'payments', claim: 'Métodos de pago', status: 'unknown' });
  }

  if (place.service_modes.includes('dine_in')) {
    const { yes = 0, no = 0 } = summary?.parking ?? {};
    facts.push(
      yes === 0 && no === 0
        ? { id: 'parking', claim: 'Estacionamiento', status: 'unknown' }
        : yes >= no
          ? {
              id: 'parking',
              claim: 'Hay estacionamiento',
              status: 'confirmed',
              basis: 'confirmed',
              visits: yes,
            }
          : {
              id: 'parking',
              claim: 'Sin estacionamiento',
              status: 'confirmed',
              basis: 'confirmed',
              visits: no,
            },
    );
  }
  return facts;
}

/** Opens directions in the phone's maps app (Google Maps or Apple Maps). */
function openDirections(lat: number, lng: number, name: string) {
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  // TODO(analytics): track directions_clicked with place_id.
  void Linking.openURL(url);
}

/** Place profile: what the place is, what visits proved, and the visits themselves. */
export function PlaceView({ place }: { place: PlaceDetail }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const stack = useWindowDimensions().fontScale > 1.15;
  const {
    data: summary,
    isPending: summaryPending,
    isError: summaryError,
    refetch: refetchSummary,
  } = usePlaceSummary(place.id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const tagNames = place.tags.map((t) => t.tag?.name).filter(Boolean) as string[];
  const meta = [
    tagNames.slice(0, 2).join(', '),
    placeMeta(undefined, place.service_modes, place.area?.name),
  ]
    .filter(Boolean)
    .join(' · ');

  const hasScore = !!summary && summary.raters > 0 && summary.avg_rating != null;
  const location = summary?.location;

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={back} />
        <IconButton
          icon={ShareIcon}
          accessibilityLabel="Compartir"
          // TODO(phase-8): share the public web URL once the place pages exist.
          onPress={() => Share.share({ message: `${place.name} en crumbz` })}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headline" accessibilityRole="header">
            {place.name}
          </Text>
          {meta ? (
            <Text variant="bodySmall" tone="textMuted">
              {meta}
            </Text>
          ) : null}
          {place.address ? (
            <Text variant="bodySmall" tone="textMuted">
              {place.address}
            </Text>
          ) : null}
          <View style={styles.links}>
            {location ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Cómo llegar a ${place.name}`}
                onPress={() => openDirections(location.lat, location.lng, place.name)}
                style={({ pressed }) => [styles.link, pressed && { backgroundColor: c.pressed }]}
              >
                <Navigation size={16} color={c.text} strokeWidth={2} />
                <Text variant="bodySmall" style={styles.underline}>
                  Cómo llegar
                </Text>
              </Pressable>
            ) : null}
            {/* Without WhatsApp, Instagram lives in the action bar instead. */}
            {place.instagram && place.whatsapp ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Instagram de ${place.name}: @${place.instagram}`}
                // TODO(analytics): track instagram_clicked.
                onPress={() => Linking.openURL(`https://instagram.com/${place.instagram}`)}
                style={({ pressed }) => [styles.link, pressed && { backgroundColor: c.pressed }]}
              >
                <Text variant="bodySmall" style={styles.underline}>
                  {`@${place.instagram}`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {hasScore ? (
          <ScoreClaim
            score={{
              value: Number(summary.avg_rating),
              raters: summary.raters,
              distribution: summary.distribution,
            }}
          />
        ) : summaryError ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => refetchSummary()}
            style={[styles.noVisits, { backgroundColor: c.surface }]}
          >
            <Text variant="title">No pudimos cargar las visitas</Text>
            <Text variant="bodySmall" tone="danger">
              Revisa tu conexión y toca aquí para reintentar.
            </Text>
          </Pressable>
        ) : summaryPending && place.posts_count > 0 ? (
          <View style={[styles.noVisits, styles.loadingBox, { backgroundColor: c.surface }]}>
            <ActivityIndicator color={c.textMuted} />
            <Text variant="bodySmall" tone="textMuted">
              Cargando visitas…
            </Text>
          </View>
        ) : (
          <View style={[styles.noVisits, { backgroundColor: c.surface }]}>
            <Text variant="title">Todavía sin visitas</Text>
            <Text variant="bodySmall" tone="textMuted">
              Cuando alguien publique su visita, aquí verás el puntaje, el gasto por persona y cómo
              se paga.
            </Text>
          </View>
        )}

        {summary && summary.photos.length > 0 ? (
          <PhotoPlates
            photos={summary.photos.map((p) => ({
              id: p.id,
              author: `@${p.author}`,
              uri: photoUrl(thumbPath(p.path)),
            }))}
          />
        ) : null}

        <PendingVisits placeId={place.id} />

        <View>
          {factsFor(place, summary).map((fact, i) => (
            <ProofPair key={fact.id} fact={fact} first={i === 0} />
          ))}
        </View>

        {summary && summary.dishes.length > 0 ? (
          <View style={styles.section}>
            <Text variant="title" accessibilityRole="header">
              Qué pedir
            </Text>
            <View>
              {summary.dishes.map((d, i) => (
                <View
                  key={d.id}
                  style={[
                    styles.dish,
                    stack && styles.dishStacked,
                    i > 0 && { borderTopWidth: 1, borderTopColor: c.line },
                  ]}
                >
                  <Text variant="bodyStrong" style={styles.dishName}>
                    {d.name}
                  </Text>
                  {/* Same reserved slot and gap as ProofPair: every proof ends in one column. */}
                  <View style={styles.dishProof}>
                    {d.recommended > 0 ? (
                      <Text variant="labelStrong" tone="proof" tabular>
                        {d.recommended === 1
                          ? '1 lo recomienda'
                          : `${d.recommended} lo recomiendan`}
                      </Text>
                    ) : (
                      <Text variant="label" tone="textMuted" tabular>
                        {d.mentions === 1
                          ? 'pedido en 1 visita'
                          : `pedido en ${d.mentions} visitas`}
                      </Text>
                    )}
                    <View style={styles.proofSlot} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {summary && summary.recent.length > 0 ? (
          <View style={styles.section}>
            <Text variant="title" accessibilityRole="header">
              Visitas
            </Text>
            <View>
              {summary.recent.map((v, i) => (
                <VisitRow
                  key={v.id}
                  first={i === 0}
                  title={v.author.display_name}
                  meta={visitMeta(v.visited_on, v.mode, v.spend)}
                  rating={v.rating}
                  thumbUri={v.cover ? photoUrl(thumbPath(v.cover)) : null}
                  excerpt={v.body}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <PlaceActionBar
        whatsapp={place.whatsapp}
        instagram={place.instagram}
        onPublish={() => router.push(`/visit/${place.slug}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  /** Matches ProofPair's chevron slot (18) so dish proofs align with the facts above. */
  proofSlot: { width: 18 },
  dishProof: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  header: { gap: space.xs },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  link: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
  },
  underline: { textDecorationLine: 'underline' },
  noVisits: { borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  section: { gap: space.sm, paddingTop: space.sm },
  dish: {
    minHeight: touchTarget,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  dishStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: space.xxs },
  dishName: { flex: 1 },
});
