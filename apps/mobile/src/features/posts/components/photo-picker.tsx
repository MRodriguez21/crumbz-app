import { POST_PHOTOS_MAX } from '@crumbz/shared';
import { Image } from 'expo-image';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { photoAspectRatio, radius, space, touchTarget, useColors } from '@/theme';

import { pickFromLibrary, takePhoto, type PickedPhoto } from '../photos';

type Props = { value: PickedPhoto[]; onChange: (photos: PickedPhoto[]) => void };

const PER_ROW = 3;

/** Up to 6 photos on fixed 4:5 plates. Compression happens when the visit is published. */
export function PhotoPicker({ value, onChange }: Props) {
  const c = useColors();
  const [cameraDenied, setCameraDenied] = useState<{ settings: boolean } | null>(null);
  const remaining = POST_PHOTOS_MAX - value.length;

  const fromLibrary = async () => {
    const picked = await pickFromLibrary(remaining);
    if (picked.length) onChange([...value, ...picked].slice(0, POST_PHOTOS_MAX));
  };

  const fromCamera = async () => {
    setCameraDenied(null);
    const result = await takePhoto();
    if (!result.ok) return setCameraDenied({ settings: result.canOpenSettings });
    if (result.photos.length) onChange([...value, ...result.photos].slice(0, POST_PHOTOS_MAX));
  };

  // Pad the last row so plates keep the same width.
  const cells: (PickedPhoto | null)[] = [...value];
  while (cells.length % PER_ROW !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / PER_ROW }, (_, r) =>
    cells.slice(r * PER_ROW, r * PER_ROW + PER_ROW),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="labelStrong">Fotos</Text>
        <Text variant="label" tone="textMuted" tabular>
          {`${value.length} de ${POST_PHOTOS_MAX}`}
        </Text>
      </View>

      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((photo, i) =>
            photo ? (
              <View key={photo.id} style={styles.plate}>
                <Image
                  source={{ uri: photo.uri }}
                  style={[styles.image, { backgroundColor: c.photoPlaceholder }]}
                  contentFit="cover"
                  accessibilityLabel={`Foto ${r * PER_ROW + i + 1}`}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar foto ${r * PER_ROW + i + 1}`}
                  onPress={() => onChange(value.filter((p) => p.id !== photo.id))}
                  hitSlop={8}
                  style={[styles.remove, { backgroundColor: c.scrim }]}
                >
                  <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <View key={`empty-${i}`} style={styles.plate} />
            ),
          )}
        </View>
      ))}

      {remaining > 0 ? (
        <View style={styles.actions}>
          <Button label="Tomar foto" icon={Camera} variant="outline" onPress={fromCamera} />
          <Button label="Galería" icon={ImagePlus} variant="outline" onPress={fromLibrary} />
        </View>
      ) : null}

      {cameraDenied ? (
        <View>
          <Text variant="label" tone="danger" accessibilityLiveRegion="polite">
            Necesitamos permiso de cámara para tomar la foto.
          </Text>
          {cameraDenied.settings ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => Linking.openSettings()}
              style={styles.inline}
            >
              <Text variant="label" style={styles.underline}>
                Abrir ajustes
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text variant="label" tone="textMuted">
          Opcional. Las comprimimos en tu teléfono para gastar pocos datos.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', gap: space.sm },
  plate: { flex: 1, aspectRatio: photoAspectRatio },
  image: { flex: 1, borderRadius: radius.md },
  remove: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: space.sm },
  inline: { minHeight: touchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
});
