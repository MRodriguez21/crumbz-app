import { fontFamily, typography } from '@crumbz/ui';
import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/text';
import { radius, space, touchTarget, useColors } from '@/theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Visible rows for multiline fields (the box grows to fit them). */
  minLines?: number;
  /** Persistent hint below the field (hidden while an error shows). */
  helper?: string;
  /** Field-level error, shown right under the input and announced. */
  error?: string;
  /** Live status line (e.g. availability) shown instead of the helper. */
  status?: ReactNode;
  /** Right-aligned counter such as "12/280". */
  counter?: string;
};

/** Labelled input with inline helper, status and error (never placeholder-only labels). */
export function TextField({
  label,
  helper,
  error,
  status,
  counter,
  minLines,
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.danger : focused ? c.text : c.line;
  const active = focused || !!error;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="labelStrong">{label}</Text>
        {counter ? (
          <Text variant="label" tone="textMuted" tabular>
            {counter}
          </Text>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? helper}
        placeholderTextColor={c.textMuted}
        selectionColor={c.text}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: c.text,
            backgroundColor: c.surfaceRaised,
            borderColor,
            // 1px hairline at rest, 2px when active; padding gives back the extra
            // pixel so the text never shifts.
            borderWidth: active ? 2 : 1,
            paddingHorizontal: space.md - (active ? 1 : 0),
            paddingVertical: space.sm - (active ? 1 : 0),
          },
          minLines
            ? { minHeight: minLines * body.lineHeight + space.sm * 2, textAlignVertical: 'top' }
            : null,
        ]}
        {...input}
      />
      {error ? (
        <Text variant="label" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : status ? (
        status
      ) : helper ? (
        <Text variant="label" tone="textMuted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const body = typography.body;

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  input: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    fontFamily: fontFamily.native.regular,
    fontSize: body.size,
  },
});
