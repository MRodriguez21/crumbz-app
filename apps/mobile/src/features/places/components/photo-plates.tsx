import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { photoAspectRatio, radius, space, useColors } from '@/theme';

type Plate = { id: string; author: string; uri?: string };

/** How many plates fit a row on a phone while staying comparable. */
const ROW_MAX = 4;

/**
 * User photos on fixed 4:5 plates so visits compare side by side, like specimens on a
 * sheet. Plates without a `uri` are placeholders (the demo screen).
 */
export function PhotoPlates({ photos, size = 'row' }: { photos: Plate[]; size?: 'row' | 'small' }) {
  const c = useColors();
  const shown = photos.slice(0, ROW_MAX);
  // Keep plate widths stable when there are fewer photos than slots.
  const fillers = size === 'row' ? Math.max(0, ROW_MAX - shown.length) : 0;
  return (
    <View style={[styles.row, size === 'small' && styles.small]}>
      {shown.map((p) =>
        p.uri ? (
          <Image
            key={p.id}
            source={{ uri: p.uri }}
            contentFit="cover"
            accessibilityLabel={`Foto de ${p.author}`}
            style={[
              styles.plate,
              size === 'small' && styles.plateSmall,
              { backgroundColor: c.photoPlaceholder },
            ]}
          />
        ) : (
          <View
            key={p.id}
            accessible
            accessibilityRole="image"
            // Placeholder: don't announce a photo that doesn't exist yet.
            accessibilityLabel="Foto pendiente"
            style={[
              styles.plate,
              size === 'small' && styles.plateSmall,
              { backgroundColor: c.photoPlaceholder },
            ]}
          />
        ),
      )}
      {Array.from({ length: fillers }, (_, i) => (
        <View key={`filler-${i}`} style={styles.plate} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  small: { gap: space.xs },
  plate: { flex: 1, aspectRatio: photoAspectRatio, borderRadius: radius.md },
  plateSmall: { flex: 0, width: 40, borderRadius: radius.sm },
});
