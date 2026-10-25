import type { Database } from '@crumbz/shared';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import env from '@/src/lib/env';

/**
 * Per-request client bound to the user's session cookies (Server Components, Server Functions,
 * Route Handlers). Reading cookies makes the route dynamic: wrap callers in <Suspense>.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // TODO(phase-1): refresh sessions in proxy.ts once auth lands on the web.
          }
        },
      },
    },
  );
}
