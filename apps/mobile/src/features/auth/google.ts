import Constants, { ExecutionEnvironment } from 'expo-constants';

import env from '@/lib/env';
import { supabase } from '@/lib/supabase';

import { AuthUserError, GENERIC_SIGN_IN_ERROR, type SignInResult } from './errors';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

/** Expo Go doesn't bundle the native Google module; it needs a development build. */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isGoogleConfigured = Boolean(env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) && !isExpoGo;

// Loaded lazily so merely importing this file never crashes Expo Go.
let google: GoogleSigninModule | null = null;
function getGoogle(): GoogleSigninModule {
  if (!google) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      google = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
    } catch {
      // Native module missing (Expo Go or a build without it).
      throw new AuthUserError('Entrar con Google necesita el build de desarrollo de crumbz.');
    }
    google.GoogleSignin.configure({
      // The Web client ID makes Google issue an ID token Supabase can verify.
      webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }
  return google;
}

/** Native Google sign-in, then exchange the ID token for a Supabase session. */
export async function signInWithGoogle(): Promise<SignInResult> {
  if (isExpoGo) {
    throw new AuthUserError('Entrar con Google necesita el build de desarrollo de crumbz.');
  }
  if (!isGoogleConfigured) {
    throw new AuthUserError('El inicio con Google todavía no está configurado.');
  }

  const { GoogleSignin, isErrorWithCode, statusCodes } = getGoogle();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') return 'cancelled';

    const idToken = res.data.idToken;
    if (!idToken) throw new AuthUserError(GENERIC_SIGN_IN_ERROR);

    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw new AuthUserError(GENERIC_SIGN_IN_ERROR);
    return 'signed-in';
  } catch (e) {
    if (e instanceof AuthUserError) throw e;
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.IN_PROGRESS) return 'cancelled';
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new AuthUserError(
          'Necesitas Google Play Services actualizado para entrar con Google.',
        );
      }
    }
    throw new AuthUserError(GENERIC_SIGN_IN_ERROR);
  }
}

export async function signOutFromGoogle() {
  if (!isGoogleConfigured) return;
  try {
    await getGoogle().GoogleSignin.signOut();
  } catch {
    // Not signed in with Google: nothing to clear.
  }
}
