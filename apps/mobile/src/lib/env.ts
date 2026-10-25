import { z } from 'zod';

// Expo only inlines EXPO_PUBLIC_* vars accessed statically, so each one is read by name.
const env = z
  .object({
    EXPO_PUBLIC_SUPABASE_URL: z.url(),
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  })
  .parse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY || undefined,
  });

export default env;
