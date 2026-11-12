import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

import { AuthUserError, GENERIC_SIGN_IN_ERROR, type SignInResult } from './errors';

/**
 * Native Sign in with Apple (iOS only). Ready in code; it needs an Apple Developer
 * account and the Apple provider enabled in Supabase before it can be used.
 * TODO(apple): enable once the Apple Developer account exists (see docs/auth.md).
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<SignInResult> {
  // Apple signs a hash of the nonce; Supabase checks the raw value against it.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) throw new AuthUserError(GENERIC_SIGN_IN_ERROR);

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw new AuthUserError(GENERIC_SIGN_IN_ERROR);

    // Apple shares the name only on the first sign-in: keep it to prefill the profile.
    const { givenName, familyName } = credential.fullName ?? {};
    const fullName = [givenName, familyName].filter(Boolean).join(' ');
    if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });

    return 'signed-in';
  } catch (e) {
    if (e instanceof AuthUserError) throw e;
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') {
      return 'cancelled';
    }
    throw new AuthUserError(GENERIC_SIGN_IN_ERROR);
  }
}
