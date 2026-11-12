import { APP_NAME } from '@crumbz/shared';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GoogleMark } from '@/components/google-mark';
import { Text } from '@/components/text';
import { isAppleSignInAvailable, signInWithApple } from '@/features/auth/apple';
import { AuthUserError, GENERIC_SIGN_IN_ERROR, type SignInResult } from '@/features/auth/errors';
import { signInWithGoogle } from '@/features/auth/google';
import { radius, space, touchTarget, useColors } from '@/theme';

type Provider = 'google' | 'apple';

export default function SignInScreen() {
  const c = useColors();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string>();
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  // Route guards take over once the session exists; we only report failures here.
  const run = async (provider: Provider, fn: () => Promise<SignInResult>) => {
    setBusy(provider);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof AuthUserError ? e.message : GENERIC_SIGN_IN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.background,
          paddingTop: insets.top + space.xxxl,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}
    >
      <View style={styles.story}>
        <View style={styles.intro}>
          <Text variant="headline" accessibilityRole="header">
            {APP_NAME}
          </Text>
          <Text variant="title">Dónde comer en Caracas, dicho por gente que fue.</Text>
          <Text tone="textMuted">
            Cada puntaje te dice cuántas personas reales lo respaldan. Nadie puede comprarlo.
          </Text>
        </View>

        {/* Static sample of the claim→proof pair, so trust is visible before signing in. */}
        <View
          accessible
          accessibilityLabel="Ejemplo: puntaje 8,6, de 47 personas reales"
          style={[styles.sample, { backgroundColor: c.surface }]}
        >
          <Text variant="display" tabular>
            8,6
          </Text>
          <View style={styles.sampleProof}>
            <Text variant="labelStrong" tone="proof">
              47 personas reales
            </Text>
            <Text variant="label" tone="textMuted">
              Ejemplo de cómo se ve un puntaje
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.row}>
          <Button
            label="Continuar con Google"
            variant="outline"
            iconElement={<GoogleMark />}
            loading={busy === 'google'}
            disabled={busy !== null && busy !== 'google'}
            onPress={() => run('google', signInWithGoogle)}
          />
        </View>

        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={radius.pill}
            style={styles.apple}
            onPress={() => run('apple', signInWithApple)}
          />
        ) : null}

        {error ? (
          <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}

        {/* TODO(phase-8): link to the published Terms and Privacy pages. */}
        <Text variant="label" tone="textMuted" style={styles.legal}>
          Al continuar aceptas los Términos y la Política de privacidad de {APP_NAME}.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.lg, justifyContent: 'space-between' },
  story: { gap: space.xxl },
  intro: { gap: space.sm },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
  },
  sampleProof: { flex: 1, gap: space.xxs },
  actions: { gap: space.md },
  row: { flexDirection: 'row' },
  apple: { height: touchTarget, width: '100%' },
  legal: { textAlign: 'center' },
});
