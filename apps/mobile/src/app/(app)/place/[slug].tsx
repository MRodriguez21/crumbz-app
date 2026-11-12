import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Bookmark, ChevronLeft, Share as ShareIos, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { PhotoPlates } from '@/features/places/components/photo-plates';
import { PlaceActionBar } from '@/features/places/components/place-action-bar';
import { ProofPair } from '@/features/places/components/proof-pair';
import { ScoreClaim } from '@/features/places/components/score-claim';
import { DEMO_PLACE_SLUG, getDemoPlace } from '@/features/places/demo-place';
import { space, useColors } from '@/theme';

// Each OS gets its own back and share glyphs.
const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;
const ShareIcon = Platform.OS === 'ios' ? ShareIos : Share2;

export default function PlaceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  // TODO(phase-4): usePlace(slug) from Supabase, with loading and error states.
  const place = getDemoPlace(slug);
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!place) {
    return (
      <View style={[styles.screen, styles.empty, { backgroundColor: c.background }]}>
        <Text variant="title">No encontramos este lugar</Text>
        <Text tone="textMuted">Puede que el enlace esté incompleto o que lo hayan quitado.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={back} />
        <View style={styles.appBarEnd}>
          <IconButton
            icon={Bookmark}
            accessibilityLabel={saved ? 'Quitar de quiero ir' : 'Agregar a quiero ir'}
            active={saved}
            onPress={() => setSaved((s) => !s)}
          />
          <IconButton
            icon={ShareIcon}
            accessibilityLabel="Compartir"
            onPress={() => Share.share({ message: `${place.name} en crumbz` })}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headline" accessibilityRole="header">
            {place.name}
          </Text>
          <Text variant="bodySmall" tone="textMuted" tabular>
            {`${place.category} · ${place.area} · ${place.distance}`}
          </Text>
          <Text variant="bodySmall" tabular>
            {`#${place.rank.position} en ${place.rank.tag} · ${place.rank.city}`}
          </Text>
          {place.slug === DEMO_PLACE_SLUG ? (
            <Text variant="label" tone="textMuted">
              Datos de ejemplo, no son reales.
            </Text>
          ) : null}
        </View>

        <ScoreClaim score={place.score} />

        <PhotoPlates photos={place.photos} />

        <View>
          {place.facts.map((fact, i) => (
            <ProofPair key={fact.id} fact={fact} first={i === 0} />
          ))}
        </View>
      </ScrollView>

      <PlaceActionBar
        whatsapp={place.whatsapp}
        // TODO(phase-3): open the publish-visit flow prefilled with this place.
        onPublish={() => undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  appBarEnd: { flexDirection: 'row' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  header: { gap: space.xs },
});
