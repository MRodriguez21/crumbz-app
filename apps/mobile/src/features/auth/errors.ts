/** Error whose message is safe to show to the user as-is (Spanish). */
export class AuthUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthUserError';
  }
}

export type SignInResult = 'signed-in' | 'cancelled';

export const GENERIC_SIGN_IN_ERROR =
  'No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.';
