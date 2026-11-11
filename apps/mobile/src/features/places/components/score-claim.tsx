import { formatScore } from '@crumbz/shared';
import { fontFamily } from '@crumbz/ui';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, useColors } from '@/theme';

import type { PlaceProfile } from '../types';

/** The score as a claim with its proof: who rated it and how the ratings spread. */
export function ScoreClaim({ score }: { score: PlaceProfile['score'] }) {
  const c = useColors();
  const max = Math.max(...score.distribution.map((d) => d.count), 1);
  const value = formatScore(score.value);

  return (
    <View
      accessible
      accessibilityLabel={`Puntaje ${value} de 10, de ${score.raters} personas reales. Solo cuenta la última visita de cada una.`}
      style={[styles.box, { backgroundColor: c.surface }]}
    >
      <View style={styles.top}>
        <Text variant="display" tabular style={styles.value}>
          {value}
        </Text>
        <View style={styles.dist}>
          {score.distribution.map((d) => (
            <View key={d.label} style={styles.row}>
              <Text variant="label" tone="textMuted" tabular style={styles.bucket}>
                {d.label}
              </Text>
              <View style={[styles.track, { backgroundColor: c.line }]}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: c.text, width: `${(d.count / max) * 100}%` },
                  ]}
                />
              </View>
              <Text variant="label" tone="textMuted" tabular style={styles.count}>
                {d.count}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text variant="bodySmall" tone="textMuted">
        <Text variant="bodySmall" tone="proof" style={styles.strong}>
          {score.raters} personas reales
        </Text>
        {' · solo cuenta la última visita de cada una'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  value: { minWidth: 96 },
  dist: { flex: 1, gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bucket: { minWidth: 32, flexShrink: 0 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  count: { minWidth: 24, flexShrink: 0, textAlign: 'right' },
  strong: { fontFamily: fontFamily.native.bold },
});
