'use server';

import { redirect } from 'next/navigation';

/** ==========
 *
 * Supacharger - Supabase Auth wrappers.
 *
 * ========== */
import {
  authActionFailure,
  type AuthActionResult,
  authActionSuccess,
} from '@/supacharger/auth/auth-action-result';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import type { SupachargerOAuthProvider } from '@/supacharger/supacharger-config-contract';
import { getURL } from '@/supacharger/utils/helpers';

import { createClient } from '../server';

function getSignUpConfirmationRedirect() {
  return getURL(`/auth/confirm?next=${encodeURIComponent(SC_CONFIG.ACCOUNT_CONFIRMED_PATH)}`);
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  return error ? { success: false } : { success: true };
}

/**
 * Login user with email and password
 */
export async function loginUser(formData: FormData) {
  if (!SC_CONFIG.AUTHENTICATION.EMAIL_PASSWORD.SIGN_IN) {
    return authActionFailure('email_password_sign_in_disabled');
  }
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return authActionFailure(error);
  }

  return authActionSuccess(null);
}

/**
 * Sign / Sign Up wth Magic Link to email
 */
export async function signInWithEmail(email: string): Promise<AuthActionResult> {
  if (!SC_CONFIG.AUTHENTICATION.MAGIC_LINK.ENABLED) {
    return authActionFailure('magic_link_disabled');
  }
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
      shouldCreateUser: SC_CONFIG.AUTHENTICATION.MAGIC_LINK.ALLOW_SIGN_UP,
    },
  });

  if (error) {
    return authActionFailure(error);
  }

  return authActionSuccess(null);
}

/**
 * Create a new user with email password combo
 */
export async function createUserByEmailPassword(
  formData: FormData,
): Promise<AuthActionResult<{ userId: string | null; identityCount: number | null }>> {
  if (!SC_CONFIG.AUTHENTICATION.EMAIL_PASSWORD.SIGN_UP) {
    return authActionFailure('email_password_sign_up_disabled');
  }
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: getSignUpConfirmationRedirect(),
    },
  });

  if (error) {
    return authActionFailure(error);
  }

  return authActionSuccess({
    userId: data.user?.id ?? null,
    identityCount: Array.isArray(data.user?.identities) ? data.user.identities.length : null,
  });
}

/**
 *  Resends the activation email to unconfirmed users
 */
export async function resendAccountConfirmEmail(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: getSignUpConfirmationRedirect(),
    },
  });

  return error ? authActionFailure(error) : authActionSuccess(null);
}

/**
 * Send password reset Link
 * redirects to the form to enter the new password
 */
export async function sendPasswordReset(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getURL('/account/reset-password/new'),
  });

  return error ? authActionFailure(error) : authActionSuccess(null);
}

//// @TODO the rest is questionable

export type SupabaseOAuthProvider = SupachargerOAuthProvider;

export async function signInWithOAuth(provider: SupabaseOAuthProvider) {
  if (!SC_CONFIG.AUTH_PROVDERS_ENABLED[provider]) {
    return authActionFailure('oauth_provider_disabled');
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    return authActionFailure(error);
  }

  return redirect(data.url);
}

/**
 * Gets the current Authenticated User
 * @param {string|null} jwt - Optional JWT access token.
 * @param {boolean} [withClient=false] - If true, also return the Supabase client object.
 * @returns {Object} The user data object or an error object (and optionally the Supabase client).
 */
export async function getUser(jwt: string | null = null, withClient: boolean = false) {
  const supabase = await createClient();
  // Pass the JWT if provided, otherwise call without arguments
  const { data, error } = jwt ? await supabase.auth.getUser(jwt) : await supabase.auth.getUser();

  if (error) {
    console.log(error);
    return withClient ? { error, supabase } : error;
  }

  return withClient ? { data, supabase } : data;
}

/**
 * Gets the Current user session - note DO NOT TRUST the user data in this it's taken directly from the clients localstorage and can be tampered with.
 * https://supabase.com/docs/reference/javascript/auth-getsession
 * @returns {Object} The user data object or an error object.
 */
export async function getUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.log(error);
    return error;
  }

  return data;
}

/**
 * Check if there is a user session
 * @returns {boolean} `true` if the user session is valid, `false`
 */
export async function isLoggedIn() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return false;
  }

  return data.user.aud === 'authenticated';
}

/**
 * Verify OTP (One-Time Password) for email verification
 * @param {string} email - The email address to verify
 * @param {string} token - The OTP token received via email
 * @returns {Promise<AuthActionResult>} The safe serialisable verification response
 */
export async function verifyOtp(email: string, token: string): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (error) {
    return authActionFailure(error);
  }

  return authActionSuccess(null);
}
