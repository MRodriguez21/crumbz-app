import { describe, expect, it } from 'vitest';
import { displayNameSchema, profileCreateSchema, usernameSchema, USERNAME_MAX } from './profile';

const firstError = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? undefined : r.error?.issues[0]?.message;

describe('usernameSchema', () => {
  it('accepts letters, numbers, dot and underscore', () => {
    expect(usernameSchema.parse('ana.come_2')).toBe('ana.come_2');
  });

  it('normalizes to lowercase and trims', () => {
    expect(usernameSchema.parse('  Ana.Come ')).toBe('ana.come');
  });

  it('enforces the DB length range', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false);
    expect(usernameSchema.safeParse('a'.repeat(USERNAME_MAX)).success).toBe(true);
    expect(usernameSchema.safeParse('a'.repeat(USERNAME_MAX + 1)).success).toBe(false);
  });

  it('rejects spaces, accents and symbols with a Spanish message', () => {
    expect(firstError(usernameSchema.safeParse('ana come'))).toBe(
      'Solo letras, números, punto y guion bajo.',
    );
    expect(usernameSchema.safeParse('josé').success).toBe(false);
    expect(usernameSchema.safeParse('ana-come').success).toBe(false);
  });

  it('rejects leading or trailing dots', () => {
    expect(usernameSchema.safeParse('.ana').success).toBe(false);
    expect(usernameSchema.safeParse('ana.').success).toBe(false);
  });

  it('rejects reserved names in any case', () => {
    expect(firstError(usernameSchema.safeParse('Crumbz'))).toBe(
      'Ese nombre de usuario no está disponible.',
    );
    expect(usernameSchema.safeParse('soporte').success).toBe(false);
  });
});

describe('displayNameSchema', () => {
  it('requires at least one visible character', () => {
    expect(displayNameSchema.safeParse('   ').success).toBe(false);
    expect(displayNameSchema.parse(' Ana ')).toBe('Ana');
  });
});

describe('profileCreateSchema', () => {
  it('parses a valid onboarding payload', () => {
    expect(
      profileCreateSchema.parse({ username: 'Ana.Come', displayName: 'Ana', homeCityId: 1 }),
    ).toEqual({ username: 'ana.come', displayName: 'Ana', homeCityId: 1 });
  });
});
