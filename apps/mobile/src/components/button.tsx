import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

type Variant = 'proof' | 'outline' | 'inverse';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'inverse', icon: Icon, disabled }: ButtonProps) {
  const c = useColors();
  const fill = { proof: c.proof, inverse: c.inverse, outline: 'transparent' }[variant];
  const ink = { proof: c.onProof, inverse: c.textOnInverse, outline: c.text }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fill, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: c.text },
      ]}
    >
      <View style={styles.content}>
        {Icon ? <Icon size={20} color={ink} strokeWidth={2} /> : null}
        <Text
          variant="body"
          // Wrap instead of shrinking: never undo the user's chosen font size.
          numberOfLines={2}
          style={{ color: ink, flexShrink: 1, textAlign: 'center' }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
