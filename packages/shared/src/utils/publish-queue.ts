/**
 * Pure rules of the offline publish queue (no storage, no network), so they can be tested.
 * The mobile app owns persistence and uploads; see apps/mobile/src/features/posts/queue.
 *
 * Contract: a visit is never dropped on its own. It leaves the queue only when it was
 * published, or when the user explicitly discards a visit that cannot be published.
 */

export type QueueStatus =
  /** Waiting for its next attempt (first try, or backing off after a transient failure). */
  | 'pending'
  /** An attempt is in flight. */
  | 'publishing'
  /** The server rejected it for good: needs the user (retry after a fix, or discard). */
  | 'failed';

export interface QueueItem<TPayload> {
  /** Also the id of the visit on the server, which makes retries idempotent. */
  id: string;
  userId: string;
  payload: TPayload;
  status: QueueStatus;
  attempts: number;
  /** Epoch ms of the earliest next attempt. */
  nextAttemptAt: number;
  createdAt: number;
}

export const BACKOFF_BASE_MS = 5_000;
export const BACKOFF_MAX_MS = 10 * 60_000;

/** Wait before attempt number `attempts + 1`: 5 s, 10 s, 20 s… capped at 10 min. */
export function backoffMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(BACKOFF_BASE_MS * 2 ** (attempts - 1), BACKOFF_MAX_MS);
}

export function newQueueItem<T>(id: string, userId: string, payload: T, now: number): QueueItem<T> {
  return {
    id,
    userId,
    payload,
    status: 'pending',
    attempts: 0,
    nextAttemptAt: now,
    createdAt: now,
  };
}

/** Items of this user that should be attempted now, oldest first. */
export function dueItems<T>(items: QueueItem<T>[], userId: string, now: number): QueueItem<T>[] {
  return items
    .filter((i) => i.userId === userId && i.status === 'pending' && i.nextAttemptAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** When to wake up for the next pending attempt, or null if nothing is waiting. */
export function nextWakeAt<T>(items: QueueItem<T>[], userId: string): number | null {
  const times = items
    .filter((i) => i.userId === userId && i.status === 'pending')
    .map((i) => i.nextAttemptAt);
  return times.length ? Math.min(...times) : null;
}

export type AttemptOutcome = 'transient' | 'permanent';

/**
 * Postgres/PostgREST codes that will fail again no matter how often we retry:
 * invalid input (22023, 22P02, 23xxx checks), missing place (P0002).
 * Everything else (network, timeouts, 5xx, auth refresh) is worth retrying.
 */
export function classifyError(code: string | undefined): AttemptOutcome {
  if (!code) return 'transient';
  if (code === 'P0002' || code.startsWith('22') || code.startsWith('23')) return 'permanent';
  return 'transient';
}

export function markPublishing<T>(item: QueueItem<T>): QueueItem<T> {
  return { ...item, status: 'publishing' };
}

export function markFailedAttempt<T>(
  item: QueueItem<T>,
  outcome: AttemptOutcome,
  now: number,
): QueueItem<T> {
  const attempts = item.attempts + 1;
  if (outcome === 'permanent') return { ...item, status: 'failed', attempts };
  return { ...item, status: 'pending', attempts, nextAttemptAt: now + backoffMs(attempts) };
}

/** The user asked to try a failed (or waiting) visit again right now. */
export function markRetryNow<T>(item: QueueItem<T>, now: number): QueueItem<T> {
  return { ...item, status: 'pending', nextAttemptAt: now };
}

/**
 * After a restart nothing is in flight: attempts interrupted by the app closing or a
 * power cut go back to pending, so they are picked up again.
 */
export function recoverInterrupted<T>(items: QueueItem<T>[], now: number): QueueItem<T>[] {
  return items.map((i) =>
    i.status === 'publishing' ? { ...i, status: 'pending', nextAttemptAt: now } : i,
  );
}
