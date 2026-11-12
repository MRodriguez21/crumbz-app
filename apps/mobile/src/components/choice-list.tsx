import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { space, touchTarget, useColors } from '@/theme';

export type Choice<T extends string | number> = {
  value: T;
  label: string;
  /** Muted second line, e.g. what an option implies. */
  description?: string;
  disabled?: boolean;
};

type BaseProps<T extends string | number> = {
  label: string;
  choices: Choice<T>[];
  helper?: string;
  error?: string;
  /** Right-aligned note next to the label, e.g. "2 de 3". */
  counter?: string;
};

type SingleProps<T extends string | number> = BaseProps<T> & {
  multiple?: false;
  value: T | null;
  onChange: (value: T) => void;
};

type MultiProps<T extends string | number> = BaseProps<T> & {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
  /** Once reached, unselected rows are disabled. */
  max?: number;
};

/**
 * Bordered list of selectable rows: radio (single) or checkbox (multiple).
 * Rows, not chips: the system reads as a column of facts, and rows keep 48dp targets.
 */
export function ChoiceList<T extends string | number>(props: SingleProps<T> | MultiProps<T>) {
  const c = useColors();
  const { label, choices, helper, error, counter } = props;

  const isSelected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const atMax = props.multiple && props.max !== undefined && props.value.length >= props.max;

  const toggle = (v: T) => {
    if (!props.multiple) return props.onChange(v);
    props.onChange(
      props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v],
    );
  };

  return (
    <View
      style={styles.wrap}
      accessibilityRole={props.multiple ? undefined : 'radiogroup'}
      accessibilityLabel={label}
    >
      <View style={styles.labelRow}>
        <Text variant="labelStrong">{label}</Text>
        {counter ? (
          <Text variant="label" tone="textMuted" tabular>
            {counter}
          </Text>
        ) : null}
      </View>

      <View style={[styles.list, { borderBottomColor: c.line }]}>
        {choices.map((choice) => {
          const selected = isSelected(choice.value);
          const disabled = !!choice.disabled || (atMax && !selected);
          return (
            <Pressable
              key={String(choice.value)}
              accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: selected, disabled }}
              accessibilityHint={choice.description}
              disabled={disabled}
              onPress={() => toggle(choice.value)}
              android_ripple={{ color: c.pressed }}
              style={({ pressed }) => [
                styles.row,
                { borderTopColor: c.line },
                pressed && { backgroundColor: c.pressed },
                disabled && styles.disabled,
              ]}
            >
              <View style={styles.text}>
                <Text variant="body">{choice.label}</Text>
                {choice.description ? (
                  <Text variant="label" tone="textMuted">
                    {choice.description}
                  </Text>
                ) : null}
              </View>
              {props.multiple ? (
                <View
                  style={[
                    styles.box,
                    { borderColor: selected ? c.text : c.textMuted },
                    selected && { backgroundColor: c.text },
                  ]}
                >
                  {selected ? <Check size={14} color={c.background} strokeWidth={3} /> : null}
                </View>
              ) : (
                <View style={[styles.radio, { borderColor: selected ? c.text : c.textMuted }]}>
                  {selected ? <View style={[styles.dot, { backgroundColor: c.text }]} /> : null}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text variant="label" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="label" tone="textMuted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  // Rows, not a boxed group: a hairline above every row and below the last.
  list: { borderBottomWidth: 1 },
  row: {
    minHeight: touchTarget,
    borderTopWidth: 1,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  text: { flex: 1, gap: space.xxs },
  disabled: { opacity: 0.4 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
