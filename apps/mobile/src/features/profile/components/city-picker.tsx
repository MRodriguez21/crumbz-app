import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

import { useCities } from '../queries';

type Props = { value: number | null; onChange: (id: number) => void };

/** Single-choice city list (radio rows). Only Caracas for now; scales to a short list. */
export function CityPicker({ value, onChange }: Props) {
  const c = useColors();
  const { data: cities, isLoading, isError, refetch } = useCities();

  // With a single launch city, preselect it instead of making people tap the only option.
  const onlyCityId = cities?.length === 1 ? cities[0]!.id : null;
  useEffect(() => {
    if (value == null && onlyCityId != null) onChange(onlyCityId);
  }, [value, onlyCityId, onChange]);

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Tu ciudad">
      <Text variant="labelStrong">Tu ciudad</Text>
      {isLoading ? (
        <Text variant="label" tone="textMuted">
          Cargando ciudades…
        </Text>
      ) : isError ? (
        <Pressable accessibilityRole="button" onPress={() => refetch()} style={styles.retry}>
          <Text variant="label" tone="danger">
            No pudimos cargar las ciudades. Toca para reintentar.
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.list, { borderColor: c.line }]}>
          {(cities ?? []).map((city, i) => {
            const selected = city.id === value;
            return (
              <Pressable
                key={city.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => onChange(city.id)}
                android_ripple={{ color: c.pressed }}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: 1, borderTopColor: c.line },
                  pressed && { backgroundColor: c.pressed },
                ]}
              >
                <Text variant="body">{city.name}</Text>
                <View style={[styles.radio, { borderColor: selected ? c.text : c.textMuted }]}>
                  {selected ? <View style={[styles.dot, { backgroundColor: c.text }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <Text variant="label" tone="textMuted">
        Empezamos por Caracas. Pronto, más ciudades.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  list: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    minHeight: touchTarget,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  retry: { minHeight: touchTarget, justifyContent: 'center' },
});
