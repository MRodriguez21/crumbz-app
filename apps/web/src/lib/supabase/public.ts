import type { Database } from '@crumbz/shared';
import { createClient } from '@supabase/supabase-js';

import env from '@/src/lib/env';

/**
 * Session-less client for public, cacheable reads (place, list and profile pages).
 * Safe inside 'use cache' functions because it never touches cookies.
 */
export const supabasePublic = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
