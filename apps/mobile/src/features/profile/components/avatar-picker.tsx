import { Camera } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { space, touchTarget, useColors } from '@/theme';

import { pickAvatar } from '../avatar';

type Props = {
  /** URI currently shown (local pick or remote URL). */
  uri: string | null;
  name: string;
  onPick: (localUri: string) => void;
  onRemove: () => void;
};

/** Optional profile photo: pick (square crop) or remove. Nothing uploads until saving. */
export function AvatarPicker({ uri, name, onPick, onRemove }: Props) {
  const c = useColors();

  const choose = async () => {
    const picked = await pickAvatar();
    if (picked) onPick(picked);
  };

  return (
    <View style={styles.row}>
      <Avatar uri={uri} name={name || '?'} size={72} />
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={choose}
          style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.pressed }]}
        >
          <Camera size={20} color={c.text} strokeWidth={2} />
          <Text variant="body">{uri ? 'Cambiar foto' : 'Elegir foto'}</Text>
        </Pressable>
        {uri ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRemove}
            style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.pressed }]}
          >
            <Text variant="body" tone="textMuted">
              Quitar foto
            </Text>
          </Pressable>
        ) : (
          <Text variant="label" tone="textMuted">
            Opcional. Puedes agregarla después.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  actions: { flex: 1, gap: space.xxs },
  action: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: space.xs,
    marginHorizontal: -space.xs,
  },
});
