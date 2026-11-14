import {
  classifyError,
  dueItems,
  markFailedAttempt,
  markPublishing,
  markRetryNow,
  newQueueItem,
  nextWakeAt,
  recoverInterrupted,
  type AttemptOutcome,
  type PostCreateInput,
  type QueueItem,
} from '@crumbz/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

import {
  MissingPhotoError,
  deleteQueuedPhotos,
  deleteUploadedPhotos,
  photoPath,
  uploadPhoto,
  type QueuedPhoto,
} from './photos';

/**
 * Offline publish queue (CLAUDE.md §10): a visit is saved on the phone first and
 * uploaded in the background with retries. It is never dropped on its own.
 * The rules (backoff, transitions) are pure and tested in @crumbz/shared.
 */

const STORAGE_KEY = 'publish-queue:v1';

export type VisitDraft = {
  post: PostCreateInput;
  /** Shown while the visit is still on the phone. */
  placeName: string;
  placeSlug: string;
  photos: QueuedPhoto[];
};

export type QueuedVisit = QueueItem<VisitDraft>;

let items: QueuedVisit[] = [];
let loaded: Promise<void> | null = null;
let running = false;
/** A user whose run was requested while another one was in flight. */
let rerunFor: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let onPublished: ((visit: QueuedVisit) => void) | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

async function persist(next: QueuedVisit[]) {
  items = next;
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

const replace = (item: QueuedVisit) => persist(items.map((i) => (i.id === item.id ? item : i)));

/**
 * Reads the queue from disk once; attempts cut short by a restart go back to pending.
 * If storage can't be read, it rejects (and nothing is written), so a pending visit on
 * disk is never overwritten with an empty queue. Unparseable data is kept aside.
 */
export function loadQueue(): Promise<void> {
  loaded ??= (async () => {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(STORAGE_KEY);
    } catch (e) {
      loaded = null; // Try again next time.
      throw e;
    }
    let stored: QueuedVisit[] = [];
    if (raw) {
      try {
        stored = JSON.parse(raw) as QueuedVisit[];
      } catch {
        await AsyncStorage.setItem(`${STORAGE_KEY}:unreadable:${Date.now()}`, raw);
      }
    }
    items = recoverInterrupted(stored, Date.now());
    emit();
  })();
  return loaded;
}

/** Stops the backoff timer (sign-out or account change). */
export function stopQueue() {
  if (timer) clearTimeout(timer);
  timer = null;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSnapshot = () => items;

/** Called after each successful publish (to refresh queries). */
export function setOnPublished(handler: ((visit: QueuedVisit) => void) | null) {
  onPublished = handler;
}

export async function enqueueVisit(id: string, userId: string, draft: VisitDraft) {
  await loadQueue();
  await persist([...items, newQueueItem(id, userId, draft, Date.now())]);
  void processQueue(userId);
}

export async function retryVisit(id: string, userId: string) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  await replace(markRetryNow(item, Date.now()));
  void processQueue(userId);
}

/** Only ever called from an explicit user confirmation. */
export async function discardVisit(id: string) {
  const item = items.find((i) => i.id === id);
  await persist(items.filter((i) => i.id !== id));
  deleteQueuedPhotos(id);
  if (item) {
    // Best effort: don't leave uploaded photos of a visit that will never exist.
    deleteUploadedPhotos(item.userId, id, item.payload.photos).catch(() => undefined);
  }
}

const errorCode = (e: unknown): string | undefined =>
  typeof e === 'object' && e !== null && 'code' in e && typeof e.code === 'string'
    ? e.code
    : undefined;

/** A missing local file or a file storage refuses won't fix itself; the rest may recover. */
function storageOutcome(e: unknown): AttemptOutcome {
  if (e instanceof MissingPhotoError) return 'permanent';
  const status =
    typeof e === 'object' && e !== null && 'statusCode' in e ? String(e.statusCode) : '';
  return status === '413' || status === '415' ? 'permanent' : 'transient';
}

async function publish(visit: QueuedVisit): Promise<AttemptOutcome | 'published' | 'discarded'> {
  let current = visit;
  try {
    for (const photo of current.payload.photos) {
      if (photo.uploaded) continue;
      await uploadPhoto(current.userId, current.id, photo);
      // Remember each finished upload so a retry does not spend data on it again.
      current = {
        ...current,
        payload: {
          ...current.payload,
          photos: current.payload.photos.map((p) =>
            p.id === photo.id ? { ...p, uploaded: true } : p,
          ),
        },
      };
      await replace(current);
    }
  } catch (e) {
    return storageOutcome(e);
  }

  // Discarded while the photos were uploading: don't publish it.
  if (!items.some((i) => i.id === current.id)) return 'discarded';

  const { post, photos } = current.payload;
  const { error } = await supabase.rpc('create_post', {
    p_id: current.id,
    p_place_id: post.placeId,
    p_rating: post.rating,
    p_mode: post.mode,
    p_spend_usd: post.spendUsd ?? undefined,
    p_visited_on: post.visitedOn,
    p_body: post.body,
    p_payment_methods: post.paymentMethods,
    p_has_parking: post.hasParking ?? undefined,
    p_dishes: post.dishes.map((d) => ({
      dish_id: d.dishId ?? null,
      name: d.name,
      recommended: d.recommended,
    })),
    p_photos: photos.map((p) => ({
      id: p.id,
      path: photoPath(current.userId, current.id, p),
      width: p.width,
      height: p.height,
    })),
  });
  if (error) return classifyError(error.code);
  return 'published';
}

function schedule(userId: string) {
  stopQueue();
  const wakeAt = nextWakeAt(items, userId);
  if (wakeAt == null) return;
  timer = setTimeout(() => void processQueue(userId), Math.max(wakeAt - Date.now(), 1_000));
}

/** Publishes everything that is due for this user, one visit at a time. */
export async function processQueue(userId: string) {
  try {
    await loadQueue();
  } catch {
    return; // Storage unreadable right now; the next resume tries again.
  }
  if (running) {
    rerunFor = userId;
    return;
  }
  running = true;
  let signedOut = false;
  try {
    for (;;) {
      const [next] = dueItems(items, userId, Date.now());
      if (!next) break;

      const { data } = await supabase.auth.getSession();
      if (data.session?.user.id !== userId) {
        // Not this user's session any more: wait for the next sign-in, don't poll.
        signedOut = true;
        break;
      }

      const publishing = markPublishing(next);
      await replace(publishing);
      let outcome: AttemptOutcome | 'published' | 'discarded';
      try {
        outcome = await publish(publishing);
      } catch (e) {
        // Network errors and anything unexpected: try again later.
        outcome = classifyError(errorCode(e));
      }

      const latest = items.find((i) => i.id === next.id);
      if (!latest || outcome === 'discarded') continue; // Discarded while in flight.
      if (outcome === 'published') {
        await persist(items.filter((i) => i.id !== next.id));
        deleteQueuedPhotos(next.id);
        onPublished?.(latest);
      } else {
        await replace(markFailedAttempt(latest, outcome, Date.now()));
      }
    }
  } finally {
    running = false;
    const next = rerunFor;
    rerunFor = null;
    if (next && next !== userId) void processQueue(next);
    else if (!signedOut) schedule(userId);
  }
}
