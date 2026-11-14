import { SERVICE_MODE_LABELS, formatUsd, formatVisitDay, type ServiceMode } from '@crumbz/shared';
import type { ColorRole } from '@crumbz/ui';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { photoAspectRatio, radius, space, touchTarget, useColors } from '@/theme';

/** "Hoy · En el local · $12,50 p/p" */
export function visitMeta(day: string, mode: ServiceMode, spendUsd: number | null | undefined) {
  return [
    formatVisitDay(day),
    SERVICE_MODE_LABELS[mode],
    spendUsd != null ? `${formatUsd(Number(spendUsd))} p/p` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

type Props = {
  /** Place name; omitted where the list already belongs to one place. */
  title?: string;
  meta: string;
  rating: number;
  /** Thumbnail URI. The slot is always reserved so names line up in one column. */
  thumbUri?: string | null;
  status?: { text: string; tone: ColorRole };
  actions?: ReactNode;
  onPress?: () => void;
  first?: boolean;
};

/** One visit in the ledger: thumbnail, place and facts on the left, score on the right. */
export function VisitRow({
  title,
  meta,
  rating,
  thumbUri,
  status,
  actions,
  onPress,
  first,
}: Props) {
  const c = useColors();
  const label = [title, `puntaje ${rating} de 10`, meta, status?.text].filter(Boolean).join(', ');

  return (
    <View style={!first && { borderTopWidth: 1, borderTopColor: c.line }}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={label}
        disabled={!onPress}
        onPress={onPress}
        android_ripple={onPress ? { color: c.pressed } : undefined}
        style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: c.pressed }]}
      >
        <View style={[styles.thumb, { backgroundColor: c.photoPlaceholder }]}>
          {thumbUri ? (
            <Image
              source={{ uri: thumbUri }}
              style={styles.image}
              contentFit="cover"
              accessible={false}
            />
          ) : null}
        </View>
        <View style={styles.text}>
          {title ? (
            <Text variant="bodyStrong" numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          <Text
            variant={title ? 'label' : 'bodyStrong'}
            tone={title ? 'textMuted' : 'text'}
            tabular
            numberOfLines={1}
          >
            {meta}
          </Text>
          {status ? (
            <Text variant="label" tone={status.tone} accessibilityLiveRegion="polite">
              {status.text}
            </Text>
          ) : null}
        </View>
        <Text variant="title" tabular>
          {rating}
        </Text>
      </Pressable>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

/** A text action under a visit row: Body label, 48dp target. */
export function RowAction({
  label,
  onPress,
  tone = 'text',
}: {
  label: string;
  onPress: () => void;
  tone?: ColorRole;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.pressed }]}
    >
      <Text variant="body" tone={tone}>
        {label}
      </Text>
    </Pressable>
  );
}

const THUMB_WIDTH = 40;

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget + space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  thumb: {
    width: THUMB_WIDTH,
    aspectRatio: photoAspectRatio,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  image: { flex: 1 },
  text: { flex: 1, gap: space.xxs },
  actions: {
    flexDirection: 'row',
    gap: space.xs,
    // Text buttons start in the text column (their padding sits in the gutter).
    marginLeft: THUMB_WIDTH + space.md - space.sm,
    marginTop: -space.xs,
    paddingBottom: space.xs,
  },
  action: {
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
  },
});
