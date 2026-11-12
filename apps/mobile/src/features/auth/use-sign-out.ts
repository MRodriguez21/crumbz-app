import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';

import { signOutFromGoogle } from './google';

/** Signs out everywhere and drops cached user data. Route guards send the user to sign-in. */
export function useSignOut() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await signOutFromGoogle();
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);
}
