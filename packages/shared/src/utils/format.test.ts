import { describe, expect, it } from 'vitest';
import { formatDate, formatUsd, formatUsdRange } from './format';

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
