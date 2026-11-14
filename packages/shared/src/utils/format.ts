import { TIMEZONE } from '../config';

/**
 * Formats a USD amount with Venezuelan conventions: `$12,50`, `$1.250`, `$1.250,75`.
 * Whole amounts drop the decimals; fractional amounts always show two.
 */
export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`formatUsd: invalid amount ${amount}`);
  }
  const isWhole = Number.isInteger(Math.round(amount * 100) / 100);
  const [intPart = '0', decPart] = Math.abs(amount)
    .toFixed(isWhole ? 0 : 2)
    .split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${grouped}${decPart ? `,${decPart}` : ''}`;
}

/** Formats a 1–10 score with one decimal and a decimal comma: `8,6`. */
export function formatScore(score: number): string {
  return score.toFixed(1).replace('.', ',');
}

/** Formats a spend range per person, e.g. `$10 – $20`. */
export function formatUsdRange(min: number, max: number): string {
  return min === max ? formatUsd(min) : `${formatUsd(min)} – ${formatUsd(max)}`;
}

const dateFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Formats a date in Caracas time, e.g. `5 oct 2026`. */
export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === 'string' ? new Date(date) : date);
}

/**
 * Reads a USD amount the way people type it in Venezuela: `12,50`, `12.50`, `$12`, `1.250,75`.
 * Returns null when it is not a number. With a comma present, dots are thousands separators.
 */
export function parseUsd(input: string): number | null {
  const raw = input.replace(/[$\s]/g, '');
  if (!raw) return null;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

const isoDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar day in Caracas as `YYYY-MM-DD`, optionally shifted by whole days. */
export function caracasDay(now: Date = new Date(), offsetDays = 0): string {
  const [y, m, d] = isoDayFormatter.format(now).split('-').map(Number);
  const shifted = new Date(Date.UTC(y!, m! - 1, d! + offsetDays));
  return shifted.toISOString().slice(0, 10);
}

const dayLabelFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Label for a `YYYY-MM-DD` day relative to today: `Hoy`, `Ayer` or `mar 10 nov`. */
export function formatVisitDay(day: string, now: Date = new Date()): string {
  if (day === caracasDay(now)) return 'Hoy';
  if (day === caracasDay(now, -1)) return 'Ayer';
  return dayLabelFormatter
    .format(new Date(`${day}T00:00:00Z`))
    .replace(/[.,]/g, '')
    .replace(' de ', ' ');
}
