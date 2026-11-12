import { PLACE_KIND_LABELS, type PlaceKind, type ServiceMode } from '@crumbz/shared';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { space, touchTarget, useColors } from '@/theme';

type Props = {
  name: string;
  /** Catalog rows: meta is built from kind, modes and area. */
  kind?: PlaceKind;
  serviceModes?: ServiceMode[];
  areaName?: string | null;
  /** Google rows: Google's own secondary line (usually the address). */
  secondary?: string | null;
  onPress: () => void;
  first?: boolean;
  busy?: boolean;
  disabled?: boolean;
};

export function placeMeta(kind?: PlaceKind, modes?: ServiceMode[], area?: string | null) {
  const parts: string[] = [];
  if (kind && kind !== 'delivery_only') parts.push(PLACE_KIND_LABELS[kind]);
  if (modes && !modes.includes('dine_in')) {
    parts.push(modes.includes('delivery') ? 'Solo delivery' : 'Solo pick-up');
  }
  if (area) parts.push(area);
  return parts.join(' · ');
}

/** One place in a list: name as the claim, meta muted underneath, hairline between rows. */
export function PlaceRow({
  name,
  kind,
  serviceModes,
  areaName,
  secondary,
  onPress,
  first,
  busy,
  disabled,
}: Props) {
  const c = useColors();
  const meta = secondary ?? placeMeta(kind, serviceModes, areaName);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={meta ? `${name}, ${meta}` : name}
      accessibilityState={{ busy, disabled }}
      disabled={disabled || busy}
      onPress={onPress}
      android_ripple={{ color: c.pressed }}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: 1, borderTopColor: c.line },
        pressed && { backgroundColor: c.pressed },
      ]}
    >
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {name}
        </Text>
        {meta ? (
          <Text variant="bodySmall" tone="textMuted" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        {busy ? (
          <ActivityIndicator color={c.textMuted} />
        ) : (
          <ChevronRight size={18} color={c.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget + space.md,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  text: { flex: 1, gap: space.xxs },
  trailing: { width: 24, alignItems: 'center' },
});
