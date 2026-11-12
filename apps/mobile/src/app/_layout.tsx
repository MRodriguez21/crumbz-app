import { Manrope_500Medium, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { AuthProvider, useSession } from '@/features/auth/auth-provider';
import { useMyProfile } from '@/features/profile/queries';
import { queryClient } from '@/lib/query-client';
import { space, useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const c = useColors();
  const [fontsLoaded, fontError] = useFonts({ Manrope_500Medium, Manrope_800ExtraBold });
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  // On font failure, render with the system face rather than block the app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          value={{
            ...base,
            colors: { ...base.colors, background: c.background, text: c.text, border: c.line },
          }}
        >
          <RootNavigator />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Route guards: no session → sign-in; session without profile → onboarding;
 * session with profile → the app. The splash stays up until we know which.
 */
function RootNavigator() {
  const c = useColors();
  const { session, isLoading: authLoading } = useSession();
  const profile = useMyProfile();

  const resolving = authLoading || (!!session && profile.isPending);
  useEffect(() => {
    if (!resolving) SplashScreen.hideAsync();
  }, [resolving]);

  if (resolving) return null;

  // Can't tell whether the profile exists (offline, server error): never guess onboarding.
  if (session && profile.isError) {
    return (
      <View style={[styles.error, { backgroundColor: c.background }]}>
        <Text variant="title">No pudimos cargar tu perfil</Text>
        <Text tone="textMuted">Revisa tu conexión e inténtalo de nuevo.</Text>
        <View style={styles.errorAction}>
          <Button label="Reintentar" onPress={() => profile.refetch()} />
        </View>
      </View>
    );
  }

  const hasProfile = !!profile.data;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && hasProfile}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.sm },
  errorAction: { flexDirection: 'row', marginTop: space.lg },
});
