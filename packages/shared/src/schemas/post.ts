import { z } from 'zod';

import { PAYMENT_METHODS, SERVICE_MODES } from './place';

export const POST_PHOTOS_MAX = 6;
export const POST_DISHES_MAX = 20;
export const POST_BODY_MAX = 2000;
export const POST_SPEND_MAX = 9999;
export const DISH_NAME_MAX = 120;
export const RATING_MIN = 1;
export const RATING_MAX = 10;

/** A dish tried during the visit: an existing dish of the place, or a new one by name. */
export const postDishSchema = z
  .object({
    dishId: z.uuid().optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Escribe el nombre del plato.')
      .max(DISH_NAME_MAX, `Usa máximo ${DISH_NAME_MAX} caracteres.`),
    recommended: z.boolean(),
  })
  .strict();

/** Calendar date `YYYY-MM-DD` (the day of the visit, in Caracas time). */
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.');

/** A visit as the publish form produces it. Mirrors the checks in create_post(). */
export const postCreateSchema = z
  .object({
    placeId: z.uuid(),
    rating: z
      .number({ error: 'Ponle un puntaje del 1 al 10.' })
      .int()
      .min(RATING_MIN, 'Ponle un puntaje del 1 al 10.')
      .max(RATING_MAX, 'Ponle un puntaje del 1 al 10.'),
    mode: z.enum(SERVICE_MODES, { error: 'Elige cómo fue tu visita.' }),
    spendUsd: z
      .number()
      .min(0, 'El gasto no puede ser negativo.')
      .max(POST_SPEND_MAX, 'Revisa el gasto: es demasiado alto.')
      .nullable(),
    visitedOn: dateOnly,
    body: z.string().trim().max(POST_BODY_MAX, `Usa máximo ${POST_BODY_MAX} caracteres.`),
    paymentMethods: z.array(z.enum(PAYMENT_METHODS)),
    hasParking: z.boolean().nullable(),
    dishes: z
      .array(postDishSchema)
      .max(POST_DISHES_MAX, `Agrega máximo ${POST_DISHES_MAX} platos.`),
  })
  .transform((p) => ({
    ...p,
    // Parking only means something if you went to the venue.
    hasParking: p.mode === 'dine_in' ? p.hasParking : null,
  }));

export type PostCreateFormInput = z.input<typeof postCreateSchema>;
export type PostCreateInput = z.output<typeof postCreateSchema>;
