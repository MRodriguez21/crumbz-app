import { StyleSheet, View } from 'react-native';

import { photoAspectRatio, radius, space, useColors } from '@/theme';

type Plate = { id: string; author: string };

/**
 * User photos on fixed 4:5 plates so visits compare side by side.
 * TODO(phase-4): render expo-image thumbnails; placeholders until real photos exist.
 */
export function PhotoPlates({ photos, size = 'row' }: { photos: Plate[]; size?: 'row' | 'small' }) {
  const c = useColors();
  return (
    <View style={[styles.row, size === 'small' && styles.small]}>
      {photos.map((p) => (
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
