import { describe, expect, it } from 'vitest';

import {
  instagramSchema,
  isInVenezuela,
  placeCreateSchema,
  whatsappSchema,
  type PlaceCreateFormInput,
} from './place';

describe('whatsappSchema', () => {
  it.each([
    ['0412-123.45.67', '+584121234567'],
    ['412 1234567', '+584121234567'],
    ['+58 412 1234567', '+584121234567'],
    ['+58 0412 1234567', '+584121234567'],
    ['584241234567', '+584241234567'],
    ['0212 555 1234', '+582125551234'],
    ['+1 305 555 0100', '+13055550100'],
  ])('normalizes %s', (input, expected) => {
    expect(whatsappSchema.parse(input)).toBe(expected);
  });

  it.each(['12345', '0512 123 4567', '+58 123', 'hola'])('rejects %s', (input) => {
    expect(whatsappSchema.safeParse(input).success).toBe(false);
  });
});

describe('instagramSchema', () => {
  it.each([
    ['@Smash.Club', 'smash.club'],
    ['smash_club', 'smash_club'],
    ['https://www.instagram.com/smash.club/?hl=es', 'smash.club'],
  ])('normalizes %s', (input, expected) => {
    expect(instagramSchema.parse(input)).toBe(expected);
  });

  it('rejects invalid characters', () => {
    expect(instagramSchema.safeParse('smash club!').success).toBe(false);
  });
});

describe('isInVenezuela', () => {
  it('accepts Caracas and rejects swapped or default coordinates', () => {
    expect(isInVenezuela({ lat: 10.49, lng: -66.85 })).toBe(true);
    expect(isInVenezuela({ lat: -66.85, lng: 10.49 })).toBe(false);
    expect(isInVenezuela({ lat: 37.42, lng: -122.08 })).toBe(false);
  });
});

const base: PlaceCreateFormInput = {
  name: 'Smash Club',
  kind: 'restaurant',
  serviceModes: ['dine_in'],
  cityId: 1,
  areaId: null,
  location: { lat: 10.49, lng: -66.85 },
  paymentMethods: [],
  hasGenerator: null,
  hasParking: null,
  tagIds: [1],
  serviceAreaIds: [],
};

const issuePaths = (input: PlaceCreateFormInput) => {
  const r = placeCreateSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('placeCreateSchema', () => {
  it('accepts a dine-in place with location', () => {
    expect(placeCreateSchema.safeParse(base).success).toBe(true);
  });

  it('requires a location to serve dine-in', () => {
    expect(issuePaths({ ...base, location: null })).toContain('location');
  });

  it('rejects a location outside Venezuela', () => {
    expect(issuePaths({ ...base, location: { lat: 37.42, lng: -122.08 } })).toContain('location');
  });

  it('requires service areas for delivery', () => {
    expect(issuePaths({ ...base, serviceModes: ['dine_in', 'delivery'] })).toContain(
      'serviceAreaIds',
    );
  });

  it('requires a contact when there is no venue', () => {
    const deliveryOnly: PlaceCreateFormInput = {
      ...base,
      kind: 'delivery_only',
      serviceModes: ['delivery'],
      location: null,
      serviceAreaIds: [3],
    };
    expect(issuePaths(deliveryOnly)).toEqual(['whatsapp']);
    expect(placeCreateSchema.safeParse({ ...deliveryOnly, instagram: '@tortas.ana' }).success).toBe(
      true,
    );
  });

  it('treats empty or blank contact fields as not provided', () => {
    const r = placeCreateSchema.parse({ ...base, whatsapp: '  ', instagram: '' });
    expect(r.whatsapp).toBeUndefined();
    expect(r.instagram).toBeUndefined();
  });

  it('limits categories to three and requires one', () => {
    expect(issuePaths({ ...base, tagIds: [] })).toContain('tagIds');
    expect(issuePaths({ ...base, tagIds: [1, 2, 3, 4] })).toContain('tagIds');
  });

  it('explains a missing kind in Spanish', () => {
    const r = placeCreateSchema.safeParse({ ...base, kind: null });
    expect(r.success).toBe(false);
    expect(r.error?.issues.find((i) => i.path[0] === 'kind')?.message).toBe(
      'Elige qué tipo de lugar es.',
    );
  });

  it('dedupes service modes', () => {
    expect(
      placeCreateSchema.parse({ ...base, serviceModes: ['dine_in', 'dine_in'] }).serviceModes,
    ).toEqual(['dine_in']);
  });
});
