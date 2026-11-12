import { z } from 'zod';

import type { Database } from '../database.types';

type Enums = Database['public']['Enums'];
export type PlaceKind = Enums['place_kind'];
export type ServiceMode = Enums['service_mode'];
export type PaymentMethod = Enums['payment_method'];

// Spanish labels for the DB enums. Order is the order shown in pickers.
export const PLACE_KIND_LABELS: Record<PlaceKind, string> = {
  restaurant: 'Restaurante',
  cafe: 'Café',
  bar: 'Bar',
  bakery: 'Panadería',
  food_truck: 'Food truck',
  delivery_only: 'Solo delivery o pick-up',
  other: 'Otro',
};

export const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  dine_in: 'En el local',
  pickup: 'Pick-up',
  delivery: 'Delivery',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash_usd: 'Efectivo en divisas',
  cash_ves: 'Efectivo en bolívares',
  pago_movil: 'Pago Móvil',
  card_pos: 'Punto de venta',
  zelle: 'Zelle',
  binance: 'Binance',
  transfer: 'Transferencia',
  other: 'Otro',
};

const keys = <T extends string>(o: Record<T, string>) => Object.keys(o) as [T, ...T[]];
export const PLACE_KINDS = keys(PLACE_KIND_LABELS);
export const SERVICE_MODES = keys(SERVICE_MODE_LABELS);
export const PAYMENT_METHODS = keys(PAYMENT_METHOD_LABELS);

export const PLACE_NAME_MAX = 120;
export const PLACE_ADDRESS_MAX = 200;
export const PLACE_TAGS_MAX = 3;

/**
 * WhatsApp number normalized to E.164. Venezuelan numbers are accepted the way people
 * write them ("0412-123.45.67", "412 1234567", "+58 412 1234567"); foreign numbers need "+".
 */
export const whatsappSchema = z
  .string()
  .trim()
  .transform((raw, ctx) => {
    const digits = raw.replace(/\D/g, '');
    let e164: string | null = null;

    if (digits.startsWith('58') && (raw.startsWith('+') || digits.length === 12)) {
      // "+58 0412…" is a common mix of international and national formats.
      const national = digits.slice(2).replace(/^0/, '');
      if (/^[24]\d{9}$/.test(national)) e164 = `+58${national}`;
    } else if (raw.startsWith('+')) {
      if (/^\d{8,15}$/.test(digits)) e164 = `+${digits}`;
    } else {
      const national = digits.startsWith('0') ? digits.slice(1) : digits;
      if (/^[24]\d{9}$/.test(national)) e164 = `+58${national}`;
    }

    if (!e164) {
      ctx.addIssue({ code: 'custom', message: 'Revisa el número. Ejemplo: 0412 123 4567.' });
      return z.NEVER;
    }
    return e164;
  });

/** Instagram handle without "@", lowercase. Also accepts a profile URL. */
export const instagramSchema = z
  .string()
  .trim()
  .transform((raw) =>
    raw
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .replace(/[/?#].*$/, '')
      .toLowerCase(),
  )
  .pipe(
    z
      .string()
      .min(1, 'Escribe el usuario de Instagram.')
      .max(30, 'Un usuario de Instagram tiene máximo 30 caracteres.')
      .regex(/^[a-z0-9._]+$/, 'Solo letras, números, punto y guion bajo.'),
  );

/** Rough Venezuela bounding box: catches swapped lat/lng and emulator default locations. */
export function isInVenezuela({ lat, lng }: { lat: number; lng: number }) {
  return lat >= 0.6 && lat <= 12.3 && lng >= -73.4 && lng <= -59.8;
}

/** Empty string means "not provided"; anything else must pass the schema. */
const optionalText = <T extends z.ZodType<string, string>>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.union([z.literal('').transform(() => undefined), schema]).optional(),
  );

/** Manual place creation. Mirrors the checks in the create_place() RPC. */
export const placeCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Escribe el nombre del lugar.')
      .max(PLACE_NAME_MAX, `Usa máximo ${PLACE_NAME_MAX} caracteres.`),
    kind: z.enum(PLACE_KINDS, { error: 'Elige qué tipo de lugar es.' }),
    serviceModes: z
      .array(z.enum(SERVICE_MODES))
      .min(1, 'Elige al menos una forma de atender.')
      .transform((modes) => [...new Set(modes)]),
    cityId: z.number().int().positive(),
    areaId: z.number().int().positive().nullable(),
    location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
    address: z.string().trim().max(PLACE_ADDRESS_MAX).optional(),
    instagram: optionalText(instagramSchema),
    whatsapp: optionalText(whatsappSchema),
    paymentMethods: z.array(z.enum(PAYMENT_METHODS)),
    hasGenerator: z.boolean().nullable(),
    hasParking: z.boolean().nullable(),
    tagIds: z
      .array(z.number().int().positive())
      .min(1, 'Elige al menos una categoría.')
      .max(PLACE_TAGS_MAX, `Elige máximo ${PLACE_TAGS_MAX} categorías.`),
    serviceAreaIds: z.array(z.number().int().positive()),
  })
  .superRefine((p, ctx) => {
    const dineIn = p.serviceModes.includes('dine_in');
    if (dineIn && !p.location) {
      ctx.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Si atiende en el local, necesitamos su ubicación.',
      });
    }
    if (p.location && !isInVenezuela(p.location)) {
      ctx.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Esa ubicación está fuera de Venezuela.',
      });
    }
    if (p.serviceModes.includes('delivery') && p.serviceAreaIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['serviceAreaIds'],
        message: 'Elige al menos una zona donde hace delivery.',
      });
    }
    if (!dineIn && !p.whatsapp && !p.instagram) {
      ctx.addIssue({
        code: 'custom',
        path: ['whatsapp'],
        message: 'Sin local, agrega WhatsApp o Instagram para que puedan pedirle.',
      });
    }
  });

export type PlaceCreateFormInput = z.input<typeof placeCreateSchema>;
export type PlaceCreateInput = z.output<typeof placeCreateSchema>;
