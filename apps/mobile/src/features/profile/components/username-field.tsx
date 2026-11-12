import { USERNAME_MAX } from '@crumbz/shared';
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { space, useColors } from '@/theme';

import { USERNAME_TAKEN, type UsernameStatus } from '../queries';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
  status: UsernameStatus;
  /** Format error from the schema, shown once the field was touched. */
  error?: string;
};

/** Username input with a live availability line. "Disponible" is proof, so it's green. */
export function UsernameField({ value, onChangeText, onBlur, status, error }: Props) {
  const c = useColors();

  const statusLine =
    status === 'checking' ? (
      <Text variant="label" tone="textMuted" accessibilityLiveRegion="polite">
        Verificando…
      </Text>
    ) : status === 'available' ? (
      <View style={styles.row} accessibilityLiveRegion="polite">
        <Check size={14} color={c.proof} strokeWidth={2.5} />
        <Text variant="labelStrong" tone="proof">
          Disponible
        </Text>
      </View>
    ) : status === 'own' ? (
      <Text variant="label" tone="textMuted">
        Es tu usuario actual.
      </Text>
    ) : status === 'error' ? (
      <Text variant="label" tone="textMuted">
        No pudimos verificarlo ahora. Lo revisamos al guardar.
      </Text>
    ) : undefined;

  return (
    <TextField
      label="Nombre de usuario"
      value={value}
      onChangeText={(t) => onChangeText(t.replace(/\s/g, ''))}
      onBlur={onBlur}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="username-new"
      textContentType="username"
      maxLength={USERNAME_MAX}
      placeholder="ana.come"
      helper="Así te encuentran: getcrumbz.com/u/tu.usuario"
      error={error ?? (status === 'taken' ? USERNAME_TAKEN : undefined)}
      status={statusLine}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
