import { Check } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

export type SheetOption<T> = { value: T; label: string };

type Props<T> = {
  visible: boolean;
  title: string;
  options: SheetOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/**
 * Bottom sheet with a single-choice list (filters). Choosing closes it; tapping the
 * scrim or Back closes it without changes. Rows, not chips, like every choice in crumbz.
 */
export function SelectSheet<T>({ visible, title, options, value, onSelect, onClose }: Props<T>) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: c.scrim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: c.surfaceRaised, paddingBottom: Math.max(insets.bottom, space.md) },
          ]}
        >
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <ScrollView>
            {options.map((o, i) => {
              const selected = o.value === value;
              return (
                <Pressable
                  key={String(o.value ?? 'all')}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    onSelect(o.value);
                    onClose();
                  }}
                  android_ripple={{ color: c.pressed }}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && { borderTopWidth: 1, borderTopColor: c.line },
                    pressed && { backgroundColor: c.pressed },
                  ]}
                >
                  <Text variant={selected ? 'bodyStrong' : 'body'} style={styles.label}>
                    {o.label}
                  </Text>
                  {selected ? <Check size={20} color={c.text} strokeWidth={2.5} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space.lg,
  },
  title: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  row: {
    minHeight: touchTarget,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  label: { flex: 1 },
});
