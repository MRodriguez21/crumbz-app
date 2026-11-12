import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

type Variant = 'proof' | 'outline' | 'inverse';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  /** Custom leading mark (e.g. a brand logo) when a Lucide icon doesn't apply. */
  iconElement?: ReactNode;
  disabled?: boolean;
  /** Shows a spinner and blocks repeat presses while an action runs. */
  loading?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'inverse',
  icon: Icon,
  iconElement,
  disabled,
  loading,
}: ButtonProps) {
  const c = useColors();
  const fill = { proof: c.proof, inverse: c.inverse, outline: 'transparent' }[variant];
  const ink = { proof: c.onProof, inverse: c.textOnInverse, outline: c.text }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fill, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: c.text },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={ink} />
        ) : iconElement ? (
          iconElement
        ) : Icon ? (
          <Icon size={20} color={ink} strokeWidth={2} />
        ) : null}
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
