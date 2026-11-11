import { describe, expect, it } from 'vitest';
import { tokensToCss } from './css';
import { colors } from './tokens';

describe('tokensToCss', () => {
  const css = tokensToCss();

  it('emits every light color role as a prefixed kebab-case variable', () => {
    expect(css).toContain(`--cz-text-muted:${colors.light.textMuted};`);
    expect(css).toContain(`--cz-proof:${colors.light.proof};`);
  });

  it('overrides colors for dark mode', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\{:root\{.*--cz-proof:#4CC38A;/);
  });

  it('includes spacing and radius scales', () => {
    expect(css).toContain('--cz-space-lg:16px;');
    expect(css).toContain('--cz-radius-pill:999px;');
  });

  it('never emits Tailwind theme names that could self-reference', () => {
    expect(css).not.toMatch(/--color-/);
  });
});
