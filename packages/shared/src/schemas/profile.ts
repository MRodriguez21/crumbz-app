import { z } from 'zod';

/** Usernames nobody can take (brand, roles, routes). Compared lowercase. */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrador',
  'crumbz',
  'getcrumbz',
  'soporte',
  'support',
  'ayuda',
  'help',
  'moderador',
  'moderator',
  'oficial',
  'official',
  'root',
  'system',
  'api',
  'www',
  'app',
  'u',
  'l',
  'privacidad',
  'terminos',
  'eliminar-cuenta',
]);

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const DISPLAY_NAME_MAX = 60;
export const BIO_MAX = 280;

/**
 * Mirrors the DB check on profiles.username (`^[a-zA-Z0-9_.]{3,30}$`, citext unique).
 * Normalized to lowercase so "Ana.Come" and "ana.come" are the same handle everywhere.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN, `Usa al menos ${USERNAME_MIN} caracteres.`)
  .max(USERNAME_MAX, `Usa máximo ${USERNAME_MAX} caracteres.`)
  .regex(/^[a-z0-9_.]+$/, 'Solo letras, números, punto y guion bajo.')
  .refine((u) => !u.startsWith('.') && !u.endsWith('.'), 'No puede empezar ni terminar con punto.')
  .refine((u) => !RESERVED_USERNAMES.has(u), 'Ese nombre de usuario no está disponible.');

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Escribe cómo quieres que te vean.')
  .max(DISPLAY_NAME_MAX, `Usa máximo ${DISPLAY_NAME_MAX} caracteres.`);

export const bioSchema = z.string().trim().max(BIO_MAX, `Usa máximo ${BIO_MAX} caracteres.`);

/** First-time profile setup (onboarding). */
export const profileCreateSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  homeCityId: z.number().int().positive(),
});

/** Profile editing. Username can change; empty bio clears it. */
export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  homeCityId: z.number().int().positive().nullable(),
});

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
