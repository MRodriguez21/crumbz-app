import { describe, expect, it } from 'vitest';

import {
  BACKOFF_MAX_MS,
  backoffMs,
  classifyError,
  dueItems,
  markFailedAttempt,
  markPublishing,
  markRetryNow,
  newQueueItem,
  nextWakeAt,
  recoverInterrupted,
} from './publish-queue';

const NOW = 1_000_000;
const item = (id: string, userId = 'u1', at = NOW) => newQueueItem(id, userId, { n: id }, at);

describe('backoffMs', () => {
  it('doubles from 5 s and caps at 10 min', () => {
    expect(backoffMs(0)).toBe(0);
    expect(backoffMs(1)).toBe(5_000);
    expect(backoffMs(2)).toBe(10_000);
    expect(backoffMs(4)).toBe(40_000);
    expect(backoffMs(30)).toBe(BACKOFF_MAX_MS);
  });
});

describe('classifyError', () => {
  it('retries when there is no code (network, timeout)', () => {
    expect(classifyError(undefined)).toBe('transient');
  });
  it('retries server and auth hiccups', () => {
    expect(classifyError('PGRST301')).toBe('transient');
    expect(classifyError('57014')).toBe('transient');
  });
  it('gives up on input the server will always reject', () => {
    expect(classifyError('22023')).toBe('permanent');
    expect(classifyError('23514')).toBe('permanent');
    expect(classifyError('P0002')).toBe('permanent');
  });
});

describe('queue transitions', () => {
  it('a new item is due immediately', () => {
    expect(dueItems([item('a')], 'u1', NOW).map((i) => i.id)).toEqual(['a']);
  });

  it('only returns pending items of this user, oldest first', () => {
    const items = [
      item('new', 'u1', NOW + 10),
      item('old', 'u1', NOW),
      item('other', 'u2', NOW),
      markPublishing(item('busy')),
    ];
    expect(dueItems(items, 'u1', NOW + 10).map((i) => i.id)).toEqual(['old', 'new']);
  });

  it('a transient failure waits with backoff and stays in the queue', () => {
    const once = markFailedAttempt(markPublishing(item('a')), 'transient', NOW);
    expect(once).toMatchObject({ status: 'pending', attempts: 1, nextAttemptAt: NOW + 5_000 });
    expect(dueItems([once], 'u1', NOW + 4_999)).toHaveLength(0);
    expect(dueItems([once], 'u1', NOW + 5_000)).toHaveLength(1);

    const twice = markFailedAttempt(once, 'transient', NOW + 5_000);
    expect(twice.nextAttemptAt).toBe(NOW + 5_000 + 10_000);
  });

  it('a permanent failure stops retrying but is never dropped', () => {
    const failed = markFailedAttempt(markPublishing(item('a')), 'permanent', NOW);
    expect(failed.status).toBe('failed');
    expect(dueItems([failed], 'u1', NOW + BACKOFF_MAX_MS)).toHaveLength(0);
    expect(nextWakeAt([failed], 'u1')).toBeNull();
  });

  it('the user can retry a failed item right away', () => {
    const failed = markFailedAttempt(item('a'), 'permanent', NOW);
    const retried = markRetryNow(failed, NOW + 1);
    expect(dueItems([retried], 'u1', NOW + 1)).toHaveLength(1);
  });

  it('wakes up for the earliest pending attempt', () => {
    const a = markFailedAttempt(item('a'), 'transient', NOW);
    const b = markFailedAttempt(markFailedAttempt(item('b'), 'transient', NOW), 'transient', NOW);
    expect(nextWakeAt([a, b], 'u1')).toBe(NOW + 5_000);
    expect(nextWakeAt([], 'u1')).toBeNull();
  });

  it('attempts interrupted by a restart go back to pending', () => {
    const recovered = recoverInterrupted([markPublishing(item('a')), item('b')], NOW + 99);
    expect(recovered.map((i) => i.status)).toEqual(['pending', 'pending']);
    expect(recovered[0]!.nextAttemptAt).toBe(NOW + 99);
  });
});
