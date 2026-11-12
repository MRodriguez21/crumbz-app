import { router } from 'expo-router';
import { ArrowLeft, Bookmark, ChevronLeft, Share as ShareIos, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import type { PlaceProfile } from '../types';
import { space, useColors } from '@/theme';

import { PhotoPlates } from './photo-plates';
import { PlaceActionBar } from './place-action-bar';
import { ProofPair } from './proof-pair';
import { ScoreClaim } from './score-claim';

// Each OS gets its own back and share glyphs.
const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;
const ShareIcon = Platform.OS === 'ios' ? ShareIos : Share2;

/** The phase 0.5 anchor screen with synthetic data, labelled on screen as an example. */
export function DemoPlaceView({ place }: { place: PlaceProfile }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

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
          <Text variant="label" tone="textMuted">
            Datos de ejemplo, no son reales.
          </Text>
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
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  appBarEnd: { flexDirection: 'row' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  header: { gap: space.xs },
});
