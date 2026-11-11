import { Manrope_500Medium, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { queryClient } from '@/lib/query-client';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const c = useColors();
  const [fontsLoaded, fontError] = useFonts({ Manrope_500Medium, Manrope_800ExtraBold });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // On font failure, render with the system face rather than block the app.
  if (!fontsLoaded && !fontError) return null;

  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        value={{
          ...base,
          colors: { ...base.colors, background: c.background, text: c.text, border: c.line },
        }}
      >
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}
        />
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
