import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { radius, touchTarget, useColors } from '@/theme';

type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only controls must be announced by screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  active?: boolean;
};

export function IconButton({ icon: Icon, accessibilityLabel, onPress, active }: IconButtonProps) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && { backgroundColor: c.pressed }]}
    >
      <Icon size={22} color={c.text} strokeWidth={1.75} fill={active ? c.text : 'transparent'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
