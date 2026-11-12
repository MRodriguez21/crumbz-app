import { ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/text';
import { photoAspectRatio, radius, space, touchTarget, useColors } from '@/theme';

import type { ProofFact } from '../types';

const DURATION = 180;
const EASE_OUT = Easing.out(Easing.exp);
/** Above this system font scale the proof stacks under the claim instead of beside it. */
const STACK_FONT_SCALE = 1.15;

const proofText = (f: ProofFact) => {
  if (f.status === 'unconfirmed') return 'solo lo dice el lugar';
  if (f.status === 'unknown') return 'sin datos aún';
  if (f.status === 'stated') return 'sin confirmar';
  const n = f.visits ?? 0;
  return {
    average: `promedio de ${n} visitas`,
    reported: `reportado en ${n} visitas`,
    confirmed: `confirmado en ${n} visitas`,
  }[f.basis ?? 'confirmed'];
};

const proofTone = {
  confirmed: 'proof',
  unconfirmed: 'warning',
  stated: 'textMuted',
  unknown: 'textMuted',
} as const;

/**
 * Signature move: every claim sits next to its proof. Tapping a confirmed claim unfolds
 * the visits behind it, in place. State reads by form as well as color: a bold count,
 * plain warning text, or a muted claim with no count.
 */
export function ProofPair({ fact, first }: { fact: ProofFact; first?: boolean }) {
  const c = useColors();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > STACK_FONT_SCALE;
  const [open, setOpen] = useState(false);
  const expandable = fact.status === 'confirmed' && !!fact.evidence?.length;

  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, { duration: DURATION, easing: EASE_OUT });
  }, [open, rotation]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const proof = (
    <View style={[styles.proof, stacked ? styles.proofStacked : styles.proofBeside]}>
      <Text
        variant={fact.status === 'confirmed' ? 'labelStrong' : 'label'}
        tone={proofTone[fact.status]}
        tabular
        style={stacked ? undefined : styles.proofTextBeside}
      >
        {proofText(fact)}
      </Text>
      {/* Chevron slot is always reserved so proof texts align in one column. */}
      <View style={styles.chevronSlot}>
        {expandable ? (
          <Animated.View style={chevronStyle}>
            <ChevronDown size={18} color={c.textMuted} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Animated.View
      layout={LinearTransition.duration(DURATION)}
      style={!first && { borderTopWidth: 1, borderTopColor: c.line }}
    >
      <Pressable
        disabled={!expandable}
        onPress={() => setOpen((o) => !o)}
        android_ripple={expandable ? { color: c.pressed } : undefined}
        accessibilityRole={expandable ? 'button' : 'text'}
        accessibilityState={expandable ? { expanded: open } : undefined}
        accessibilityLabel={`${fact.claim}${fact.detail ? `, ${fact.detail}` : ''}: ${proofText(fact)}`}
        style={({ pressed }) => [
          styles.row,
          stacked && styles.rowStacked,
          pressed && expandable && { backgroundColor: c.pressed },
        ]}
      >
        <View style={styles.claim}>
          <Text
            variant="bodyStrong"
            tone={fact.status === 'unknown' ? 'textMuted' : 'text'}
            tabular
          >
            {fact.claim}
          </Text>
          {fact.detail ? (
            <Text variant="label" tone="textMuted">
              {fact.detail}
            </Text>
          ) : null}
        </View>
        {proof}
      </Pressable>

      {open && fact.evidence ? (
        <Animated.View entering={FadeIn.duration(DURATION)} style={styles.evidence}>
          {fact.evidence.map((e) => (
            <View key={e.id} style={styles.visit}>
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel="Foto pendiente"
                style={[styles.visitPlate, { backgroundColor: c.photoPlaceholder }]}
              />
              <Text variant="bodySmall" tabular style={styles.visitText}>
                {e.author}
                <Text variant="bodySmall" tone="textMuted">
                  {` · ${e.when}`}
                </Text>
              </Text>
              {e.value ? (
                <Text variant="bodySmall" tabular>
                  {e.value}
                </Text>
              ) : null}
            </View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  rowStacked: { flexDirection: 'column', alignItems: 'stretch', gap: space.xs },
  claim: { flex: 1, gap: space.xxs },
  proof: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  proofBeside: { maxWidth: '50%', flexShrink: 1 },
  proofStacked: { justifyContent: 'space-between' },
  proofTextBeside: { textAlign: 'right', flexShrink: 1 },
  chevronSlot: { width: 18, alignItems: 'center' },
  evidence: { gap: space.sm, paddingBottom: space.md },
  visit: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  visitPlate: { width: 32, aspectRatio: photoAspectRatio, borderRadius: radius.sm },
  visitText: { flex: 1 },
});
