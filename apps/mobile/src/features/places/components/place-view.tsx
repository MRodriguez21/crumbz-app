import { SERVICE_MODE_LABELS, SERVICE_MODES } from '@crumbz/shared';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, Share as ShareIos, Share2 } from 'lucide-react-native';
import { Linking, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

import type { PlaceDetail } from '../queries';
import type { ProofFact } from '../types';
import { PlaceActionBar } from './place-action-bar';
import { placeMeta } from './place-row';
import { ProofPair } from './proof-pair';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;
const ShareIcon = Platform.OS === 'ios' ? ShareIos : Share2;

/**
 * Modes and zones were stated by whoever added the place ("sin confirmar");
 * the practical facts have no data until visits report them ("sin datos aún").
 */
function factsFor(place: PlaceDetail): ProofFact[] {
  const modes = SERVICE_MODES.filter((m) => place.service_modes.includes(m));
  const zones = place.service_areas.map((s) => s.area?.name).filter(Boolean) as string[];
  const facts: ProofFact[] = [
    {
      id: 'modes',
      claim: modes.map((m) => SERVICE_MODE_LABELS[m]).join(' · '),
      status: 'stated',
    },
  ];
  if (zones.length > 0) {
    facts.push({
      id: 'delivery',
      claim: zones.length === 1 ? 'Delivery a 1 zona' : `Delivery a ${zones.length} zonas`,
      detail: zones.join(', '),
      status: 'stated',
    });
  }
  facts.push(
    { id: 'spend', claim: 'Gasto por persona', status: 'unknown' },
    { id: 'payments', claim: 'Métodos de pago', status: 'unknown' },
    { id: 'generator', claim: 'Planta eléctrica', status: 'unknown' },
  );
  if (place.service_modes.includes('dine_in')) {
    facts.push({ id: 'parking', claim: 'Estacionamiento', status: 'unknown' });
  }
  return facts;
}

/** Place profile with real data. Score, photos and dishes arrive with visits (phase 3). */
export function PlaceView({ place }: { place: PlaceDetail }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const tagNames = place.tags.map((t) => t.tag?.name).filter(Boolean) as string[];
  const meta = [
    tagNames.slice(0, 2).join(', '),
    placeMeta(undefined, place.service_modes, place.area?.name),
  ]
    .filter(Boolean)
    .join(' · ');

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
          {/* TODO(phase-4): "Cómo llegar" row for places with a location (map provider decision). */}
          {/* Without WhatsApp, Instagram lives in the action bar instead. */}
          {place.instagram && place.whatsapp ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Instagram de ${place.name}: @${place.instagram}`}
              // TODO(phase-4): track instagram_clicked.
              onPress={() => Linking.openURL(`https://instagram.com/${place.instagram}`)}
              style={styles.link}
            >
              <Text variant="bodySmall" style={styles.underline}>
                {`@${place.instagram}`}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.noVisits, { backgroundColor: c.surface }]}>
          <Text variant="title">Todavía sin visitas</Text>
          <Text variant="bodySmall" tone="textMuted">
            Cuando alguien publique su visita, aquí verás el puntaje, el gasto por persona y cómo se
            paga.
          </Text>
        </View>

        <View>
          {factsFor(place).map((fact, i) => (
            <ProofPair key={fact.id} fact={fact} first={i === 0} />
          ))}
        </View>
      </ScrollView>

      <PlaceActionBar
        whatsapp={place.whatsapp}
        instagram={place.instagram}
        // TODO(phase-3): open the publish-visit flow prefilled with this place.
        onPublish={() => undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  header: { gap: space.xs },
  link: { minHeight: touchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  noVisits: { borderRadius: radius.lg, padding: space.lg, gap: space.xs },
});
