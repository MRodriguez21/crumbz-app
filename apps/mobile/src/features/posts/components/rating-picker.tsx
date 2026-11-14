import { RATING_MAX, RATING_MIN } from '@crumbz/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

type Props = { value: number | null; onChange: (rating: number) => void; error?: string };

const SCORES = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => i + RATING_MIN);
const ROWS = [SCORES.slice(0, 5), SCORES.slice(5)];

/**
 * 1–10 as two rows of five equal cells (fits a 360dp phone with 48dp targets).
 * The chosen score fills in ink; no colour, since a score is a claim, not proof.
 */
export function RatingPicker({ value, onChange, error }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Puntaje">
      <View style={styles.labelRow}>
        <Text variant="labelStrong">Puntaje</Text>
        <Text variant="label" tone="textMuted">
          1 es muy malo, 10 es excelente
        </Text>
      </View>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((score) => {
            const selected = value === score;
            return (
              <Pressable
                key={score}
                accessibilityRole="radio"
                accessibilityLabel={`${score} de 10`}
                accessibilityState={{ checked: selected }}
                onPress={() => onChange(score)}
                style={({ pressed }) => [
                  styles.cell,
                  { borderColor: selected ? c.inverse : c.line },
                  selected && { backgroundColor: c.inverse },
                  pressed && !selected && { backgroundColor: c.pressed },
                ]}
              >
                <Text
                  variant="title"
                  tabular
                  style={{ color: selected ? c.textOnInverse : c.text }}
                >
                  {score}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      {error ? (
        <Text variant="label" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  row: { flexDirection: 'row', gap: space.sm },
  cell: {
    flex: 1,
    minHeight: touchTarget + space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
