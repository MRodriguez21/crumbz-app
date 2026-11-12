import { Stack } from 'expo-router';

import { useColors } from '@/theme';

/** Signed-in area (session + profile required; guarded in the root layout). */
export default function AppLayout() {
  const c = useColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}
    />
  );
}
