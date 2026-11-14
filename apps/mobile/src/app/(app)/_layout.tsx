import { Stack } from 'expo-router';

import { usePublishQueueRunner } from '@/features/posts/use-publish-queue';
import { useColors } from '@/theme';

/** Signed-in area (session + profile required; guarded in the root layout). */
export default function AppLayout() {
  const c = useColors();
  // Publishes visits saved on the phone: on sign-in, on resume and on its own backoff.
  usePublishQueueRunner();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}
    />
  );
}
