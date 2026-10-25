import type { Database } from '@crumbz/shared';
import { createBrowserClient } from '@supabase/ssr';

import env from '@/src/lib/env';

/** Browser client for Client Components. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
