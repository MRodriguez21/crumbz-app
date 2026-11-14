import { describe, expect, it } from 'vitest';
import {
  caracasDay,
  formatDate,
  formatScore,
  formatUsd,
  formatUsdRange,
  formatVisitDay,
  parseUsd,
} from './format';

describe('formatScore', () => {
  it('uses one decimal and a decimal comma', () => {
    expect(formatScore(8.6)).toBe('8,6');
    expect(formatScore(9)).toBe('9,0');
    expect(formatScore(7.25)).toBe('7,3');
  });
});

describe('formatUsd', () => {
  it('uses comma as decimal separator', () => {
    expect(formatUsd(12.5)).toBe('$12,50');
    expect(formatUsd(0.99)).toBe('$0,99');
  });

  it('drops decimals for whole amounts', () => {
    expect(formatUsd(12)).toBe('$12');
    expect(formatUsd(0)).toBe('$0');
  });

  it('groups thousands with dots', () => {
    expect(formatUsd(1250)).toBe('$1.250');
    expect(formatUsd(1250.75)).toBe('$1.250,75');
    expect(formatUsd(1234567.8)).toBe('$1.234.567,80');
  });

  it('rounds to two decimals', () => {
    expect(formatUsd(9.999)).toBe('$10');
    expect(formatUsd(9.994)).toBe('$9,99');
  });

  it('handles negatives', () => {
    expect(formatUsd(-5.5)).toBe('-$5,50');
  });

  it('rejects non-finite values', () => {
    expect(() => formatUsd(Number.NaN)).toThrow(RangeError);
  });
});

describe('formatUsdRange', () => {
  it('formats a range', () => {
    expect(formatUsdRange(10, 20)).toBe('$10 – $20');
  });

  it('collapses equal bounds', () => {
    expect(formatUsdRange(15, 15)).toBe('$15');
  });
});

describe('formatDate', () => {
  it('uses Caracas time (UTC-4)', () => {
    // 02:00 UTC on Oct 6 is still Oct 5 in Caracas.
    expect(formatDate('2026-10-06T02:00:00Z')).toMatch(/^5 oct/);
  });
});

describe('parseUsd', () => {
  it.each([
    ['12,50', 12.5],
    ['12.50', 12.5],
    ['$12', 12],
    [' 8 ', 8],
    ['1.250,75', 1250.75],
    ['0,5', 0.5],
  ])('reads %s', (input, expected) => {
    expect(parseUsd(input)).toBe(expected);
  });

  it.each(['', 'doce', '12,505', '-5', '1,2,3'])('rejects %s', (input) => {
    expect(parseUsd(input)).toBeNull();
  });
});

describe('caracasDay', () => {
  it('uses the Caracas calendar day, not UTC', () => {
    // 02:00 UTC on Nov 14 is still Nov 13 in Caracas.
    const now = new Date('2026-11-14T02:00:00Z');
    expect(caracasDay(now)).toBe('2026-11-13');
    expect(caracasDay(now, -1)).toBe('2026-11-12');
  });

  it('crosses month boundaries', () => {
    expect(caracasDay(new Date('2026-11-01T12:00:00Z'), -1)).toBe('2026-10-31');
  });
});

describe('formatVisitDay', () => {
  const now = new Date('2026-11-14T16:00:00Z');
  it('names today and yesterday', () => {
    expect(formatVisitDay('2026-11-14', now)).toBe('Hoy');
    expect(formatVisitDay('2026-11-13', now)).toBe('Ayer');
  });
  it('shows weekday, day and month for older days', () => {
    expect(formatVisitDay('2026-11-10', now)).toBe('mar 10 nov');
  });
});
