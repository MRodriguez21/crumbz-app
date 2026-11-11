import { colors, fontFamily, radius, space, type ColorScheme } from './tokens';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const colorVars = (scheme: ColorScheme) =>
  Object.entries(scheme)
    .map(([role, value]) => `--cz-${kebab(role)}:${value};`)
    .join('');

/**
 * CSS custom properties for the web, generated from the same tokens as the app.
 * Prefixed `--cz-` so Tailwind's own `--color-*` theme variables can point at them
 * without referencing themselves. Dark values apply via prefers-color-scheme.
 */
export function tokensToCss(): string {
  const scale = [
    ...Object.entries(space).map(([k, v]) => `--cz-space-${k}:${v}px;`),
    ...Object.entries(radius).map(([k, v]) => `--cz-radius-${k}:${v}px;`),
    `--cz-font:${fontFamily.web};`,
  ].join('');

  return [
    `:root{${colorVars(colors.light)}${scale}color-scheme:light dark;}`,
    `@media (prefers-color-scheme: dark){:root{${colorVars(colors.dark)}}}`,
  ].join('');
}
