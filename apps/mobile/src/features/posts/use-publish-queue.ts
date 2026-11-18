import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/features/auth/auth-provider';

import {
  getPublishedSnapshot,
  getSnapshot,
  loadQueue,
  processQueue,
  setOnPublished,
  stopQueue,
  subscribe,
} from './queue';

/** The signed-in user's visits that are still on the phone, oldest first. */
export function usePendingVisits() {
  const { session } = useSession();
  const userId = session?.user.id;
  const all = useSyncExternalStore(subscribe, getSnapshot);
  return useMemo(() => all.filter((i) => i.userId === userId), [all, userId]);
}

/** This user's visits published in the last few seconds (shown as "Publicada"). */
export function useJustPublished() {
  const { session } = useSession();
  const userId = session?.user.id;
  const all = useSyncExternalStore(subscribe, getPublishedSnapshot);
  return useMemo(() => all.filter((i) => i.userId === userId), [all, userId]);
}

/**
 * Keeps the queue moving: on sign-in, whenever the app comes back to the foreground,
 * and on the queue's own backoff timer. Mount once, inside the signed-in area.
 */
export function usePublishQueueRunner() {
  const { session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    setOnPublished((visit) => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      void queryClient.invalidateQueries({
        queryKey: ['places', 'detail', visit.payload.placeSlug],
      });
      void queryClient.invalidateQueries({ queryKey: ['dishes', visit.payload.post.placeId] });
      void queryClient.invalidateQueries({
        queryKey: ['places', 'summary', visit.payload.post.placeId],
      });
      void queryClient.invalidateQueries({ queryKey: ['places', 'explore'] });
    });

    // A failed read is retried on the next resume; nothing is written meanwhile.
    loadQueue()
      .then(() => processQueue(userId))
      .catch(() => undefined);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') processQueue(userId).catch(() => undefined);
    });
    return () => {
      sub.remove();
      setOnPublished(null);
      stopQueue();
    };
  }, [userId, queryClient]);
}
