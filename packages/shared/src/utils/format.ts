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
