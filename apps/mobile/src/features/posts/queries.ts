import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

export const postKeys = {
  mine: (userId: string | undefined) => ['posts', 'mine', userId] as const,
  dishes: (placeId: string) => ['dishes', placeId] as const,
};

/** Dishes already registered for a place, most mentioned first (for the dish picker). */
export function usePlaceDishes(placeId: string | undefined) {
  return useQuery({
    queryKey: postKeys.dishes(placeId ?? ''),
    enabled: !!placeId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dishes')
        .select('id, name, mentions_count')
        .eq('place_id', placeId!)
        .order('mentions_count', { ascending: false })
        .order('name')
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

const MY_POSTS_SELECT = `
  id, rating, mode, spend_per_person_usd, visited_on, body, created_at,
  place:places(name, slug),
  photos:post_photos(storage_path, position)
`;

/** The signed-in user's published visits, newest first. */
export function useMyPosts() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: postKeys.mine(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(MY_POSTS_SELECT)
        .eq('user_id', userId!)
        .order('visited_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export type MyPost = NonNullable<ReturnType<typeof useMyPosts>['data']>[number];
