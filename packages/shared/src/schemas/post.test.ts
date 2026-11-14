import { describe, expect, it } from 'vitest';

import { postCreateSchema, type PostCreateFormInput } from './post';

const base: PostCreateFormInput = {
  placeId: '00000000-0000-4000-8000-000000000001',
  rating: 9,
  mode: 'dine_in',
  spendUsd: 12.5,
  visitedOn: '2026-11-14',
  body: '',
  paymentMethods: ['pago_movil'],
  hasParking: true,
  dishes: [],
};

const paths = (input: unknown) => {
  const r = postCreateSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('postCreateSchema', () => {
  it('accepts a minimal visit: rating and mode only', () => {
    const r = postCreateSchema.safeParse({
      ...base,
      spendUsd: null,
      paymentMethods: [],
      hasParking: null,
    });
    expect(r.success).toBe(true);
  });

  it('requires a 1-10 whole rating, with a message in Spanish', () => {
    expect(paths({ ...base, rating: 0 })).toEqual(['rating']);
    expect(paths({ ...base, rating: 11 })).toEqual(['rating']);
    expect(paths({ ...base, rating: 7.5 })).toEqual(['rating']);
    const r = postCreateSchema.safeParse({ ...base, rating: null });
    expect(r.error?.issues[0]?.message).toBe('Ponle un puntaje del 1 al 10.');
  });

  it('requires a mode', () => {
    expect(paths({ ...base, mode: null })).toEqual(['mode']);
  });

  it('drops parking when the visit was not at the venue', () => {
    expect(postCreateSchema.parse({ ...base, mode: 'delivery' }).hasParking).toBeNull();
    expect(postCreateSchema.parse(base).hasParking).toBe(true);
  });

  it('bounds the spend', () => {
    expect(paths({ ...base, spendUsd: -1 })).toEqual(['spendUsd']);
    expect(paths({ ...base, spendUsd: 10000 })).toEqual(['spendUsd']);
  });

  it('validates dishes and trims their names', () => {
    const r = postCreateSchema.parse({
      ...base,
      dishes: [{ name: '  Reina pepiada ', recommended: true }],
    });
    expect(r.dishes[0]).toEqual({ name: 'Reina pepiada', recommended: true });
    expect(paths({ ...base, dishes: [{ name: ' ', recommended: false }] })).toEqual([
      'dishes.0.name',
    ]);
  });
});
