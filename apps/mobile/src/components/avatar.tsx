import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useColors } from '@/theme';

type AvatarProps = {
  /** Remote URL or local file URI. */
  uri: string | null | undefined;
  name: string;
  size?: number;
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

/** Round profile photo with initials fallback. Fixed size so nothing shifts while loading. */
export function Avatar({ uri, name, size = 72 }: AvatarProps) {
  const c = useColors();
  const box = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={uri ? `Foto de ${name}` : `Sin foto: ${name}`}
      style={[styles.base, box, { backgroundColor: c.surface }]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={box}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <Text variant={size >= 64 ? 'title' : 'labelStrong'} tone="textMuted">
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
