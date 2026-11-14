import { DISH_NAME_MAX, POST_DISHES_MAX } from '@crumbz/shared';
import { Check, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { space, touchTarget, useColors } from '@/theme';

import { usePlaceDishes } from '../queries';

export type DraftDish = { dishId?: string; name: string; recommended: boolean };

type Props = { placeId: string; value: DraftDish[]; onChange: (dishes: DraftDish[]) => void };

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Dishes tried in the visit. Type to pick one the place already has (so "Reina Pepiada"
 * and "reina pepiada" stay one dish) or add a new one. Each can be marked "Lo recomiendo".
 */
export function DishPicker({ placeId, value, onChange }: Props) {
  const c = useColors();
  const { data: known } = usePlaceDishes(placeId);
  const [query, setQuery] = useState('');

  const q = norm(query);
  const chosen = new Set(value.map((d) => norm(d.name)));
  const suggestions = (known ?? [])
    .filter((d) => !chosen.has(norm(d.name)) && (q === '' || norm(d.name).includes(q)))
    .slice(0, q === '' ? 5 : 8);
  const exact = (known ?? []).find((d) => norm(d.name) === q);
  const canAddNew = q.length > 0 && !exact && !chosen.has(q);
  const full = value.length >= POST_DISHES_MAX;

  const add = (dish: DraftDish) => {
    if (full) return;
    onChange([...value, dish]);
    setQuery('');
  };

  return (
    <View style={styles.wrap}>
      {value.length > 0 ? (
        <View style={[styles.list, { borderBottomColor: c.line }]}>
          {value.map((dish, i) => (
            <View key={`${dish.name}-${i}`} style={[styles.row, { borderTopColor: c.line }]}>
              <Text variant="body" style={styles.name}>
                {dish.name}
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: dish.recommended }}
                accessibilityLabel={`Lo recomiendo: ${dish.name}`}
                onPress={() =>
                  onChange(
                    value.map((d, j) => (j === i ? { ...d, recommended: !d.recommended } : d)),
                  )
                }
                style={({ pressed }) => [styles.toggle, pressed && { backgroundColor: c.pressed }]}
              >
                <View
                  style={[
                    styles.box,
                    { borderColor: dish.recommended ? c.text : c.textMuted },
                    dish.recommended && { backgroundColor: c.text },
                  ]}
                >
                  {dish.recommended ? (
                    <Check size={14} color={c.background} strokeWidth={3} />
                  ) : null}
                </View>
                <Text variant="label">Lo recomiendo</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${dish.name}`}
                onPress={() => onChange(value.filter((_, j) => j !== i))}
                style={({ pressed }) => [styles.remove, pressed && { backgroundColor: c.pressed }]}
              >
                <X size={18} color={c.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {full ? (
        <Text variant="label" tone="textMuted">
          {`Llegaste al máximo de ${POST_DISHES_MAX} platos.`}
        </Text>
      ) : (
        <>
          <TextField
            label={value.length ? 'Agregar otro plato' : '¿Qué pediste?'}
            value={query}
            onChangeText={setQuery}
            maxLength={DISH_NAME_MAX}
            autoCapitalize="sentences"
            autoCorrect={false}
            placeholder="Ej. Reina pepiada"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (exact) add({ dishId: exact.id, name: exact.name, recommended: false });
              else if (canAddNew)
                add({ name: query.trim().replace(/\s+/g, ' '), recommended: false });
            }}
          />
          {suggestions.length > 0 || canAddNew ? (
            <View style={[styles.list, { borderBottomColor: c.line }]}>
              {suggestions.map((d) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar ${d.name}`}
                  onPress={() => add({ dishId: d.id, name: d.name, recommended: false })}
                  android_ripple={{ color: c.pressed }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderTopColor: c.line },
                    pressed && { backgroundColor: c.pressed },
                  ]}
                >
                  <Plus size={18} color={c.textMuted} strokeWidth={2} />
                  <Text variant="body" style={styles.name}>
                    {d.name}
                  </Text>
                </Pressable>
              ))}
              {canAddNew ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    add({ name: query.trim().replace(/\s+/g, ' '), recommended: false })
                  }
                  android_ripple={{ color: c.pressed }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderTopColor: c.line },
                    pressed && { backgroundColor: c.pressed },
                  ]}
                >
                  <Plus size={18} color={c.text} strokeWidth={2} />
                  <Text variant="body" style={styles.name}>
                    {`Agregar «${query.trim()}»`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  list: { borderBottomWidth: 1 },
  row: {
    minHeight: touchTarget,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  name: { flex: 1, paddingVertical: space.sm },
  toggle: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xs,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
