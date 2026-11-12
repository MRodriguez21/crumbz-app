import {
  usernameSchema,
  type ProfileCreateInput,
  type ProfileUpdateInput,
  type Database,
} from '@crumbz/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/auth-provider';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { supabase } from '@/lib/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

const UNIQUE_VIOLATION = '23505';
export const USERNAME_TAKEN = 'Ese nombre de usuario ya lo tomó alguien.';

export const profileKeys = {
  me: (userId: string | undefined) => ['profile', 'me', userId] as const,
  username: (u: string) => ['profile', 'username', u] as const,
};

/** The signed-in user's profile, or null if they haven't created it yet. */
export function useMyProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: profileKeys.me(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    staleTime: 24 * 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('cities').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export type UsernameStatus =
  'idle' | 'invalid' | 'checking' | 'available' | 'own' | 'taken' | 'error';

/** Live availability check while typing. `currentUsername` counts as available (editing). */
export function useUsernameAvailability(input: string, currentUsername?: string) {
  const debounced = useDebouncedValue(input.trim().toLowerCase(), 400);
  const parsed = usernameSchema.safeParse(debounced);
  const isOwn = !!currentUsername && debounced === currentUsername.toLowerCase();

  const query = useQuery({
    queryKey: profileKeys.username(debounced),
    enabled: parsed.success && !isOwn,
    staleTime: 30_000,
    queryFn: async () => {
      // username is citext, so eq() compares case-insensitively.
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('username', debounced);
      if (error) throw error;
      return (count ?? 0) === 0;
    },
  });

  let status: UsernameStatus;
  if (!input.trim()) status = 'idle';
  else if (input.trim().toLowerCase() !== debounced || query.isFetching) status = 'checking';
  else if (!parsed.success) status = 'invalid';
  else if (isOwn) status = 'own';
  else if (query.isError) status = 'error';
  else status = query.data ? 'available' : 'taken';

  return { status, message: parsed.success ? undefined : parsed.error.issues[0]?.message };
}

function mapProfileError(error: { code?: string } | null): Error | null {
  if (!error) return null;
  if (error.code === UNIQUE_VIOLATION) return new Error(USERNAME_TAKEN);
  return new Error('No pudimos guardar tu perfil. Inténtalo de nuevo.');
}

export function useCreateProfile() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileCreateInput & { avatarPath?: string | null }) => {
      const userId = session!.user.id;
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        username: input.username,
        display_name: input.displayName,
        home_city_id: input.homeCityId,
        avatar_path: input.avatarPath ?? null,
      });
      const mapped = mapProfileError(error);
      if (mapped) throw mapped;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me(session?.user.id) }),
  });
}

export function useUpdateProfile() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileUpdateInput & { avatarPath?: string | null }) => {
      const userId = session!.user.id;
      const { error } = await supabase
        .from('profiles')
        .update({
          username: input.username,
          display_name: input.displayName,
          bio: input.bio || null,
          home_city_id: input.homeCityId,
          ...(input.avatarPath !== undefined && { avatar_path: input.avatarPath }),
        })
        .eq('id', userId);
      const mapped = mapProfileError(error);
      if (mapped) throw mapped;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me(session?.user.id) }),
  });
}
