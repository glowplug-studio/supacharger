'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

/** ==========
 *
 * Supacharger - Supabase Auth wrappers.
 *
 * ========== */
import { authActionFailure, type AuthActionResult, authActionSuccess } from '@/supacharger/auth/auth-action-result';
import { getAuthLoginRedirect } from '@/supacharger/auth/login-redirect';
import { hasVerifiedSessionForEmail } from '@/supacharger/auth/otp-verification';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import type { SupachargerOAuthProvider } from '@/supacharger/supacharger-config-contract';
import { evaluatePasswordStrength, getURL, isValidEmail } from '@/supacharger/utils/helpers';

import { createClient } from '../server';

const emailSchema = z.string().trim().pipe(z.email());
const passwordSchema = z.string().min(1);
const signUpEmailSchema = emailSchema.refine(isValidEmail);
const signUpPasswordSchema = passwordSchema.refine((password) => evaluatePasswordStrength(password).valid);

function otpSchema() {
  return z.string().regex(/^\d+$/).length(SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.OTP_LENGTH);
}

function passwordlessModeHasOtp(mode: 'disabled' | 'link' | 'otp' | 'otp-and-link') {
  return mode === 'otp' || mode === 'otp-and-link';
}

function getSignUpConfirmationRedirect(nextPath: unknown = null) {
  const destination = getSafeNextPath(nextPath) ?? SC_CONFIG.ACCOUNT_CONFIRMED_PATH;
  return getURL(`/auth/confirm?next=${encodeURIComponent(destination)}`);
}

function getPasswordlessConfirmationRedirect(nextPath: unknown = null) {
  const loginDestination = getAuthLoginRedirect(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION);
  const next = getSafeNextPath(nextPath) ?? `${loginDestination.pathname}${loginDestination.search}`;

  return getURL(`/auth/confirm?next=${encodeURIComponent(next)}`);
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
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return authActionFailure('validation_failed');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return authActionFailure(error);
  }

  return authActionSuccess(null);
}

async function sendPasswordlessEmail(
  email: string,
  shouldCreateUser: boolean,
  nextPath: unknown = null,
): Promise<AuthActionResult> {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) return authActionFailure('validation_failed');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsedEmail.data,
    options: {
      emailRedirectTo: getPasswordlessConfirmationRedirect(nextPath),
      shouldCreateUser,
    },
  });

  if (error) {
    return authActionFailure(error);
  }

  return authActionSuccess(null);
}

/**
 * Send the configured passwordless sign-in email to an existing user.
 */
export async function signInWithEmail(email: string, nextPath: string | null = null): Promise<AuthActionResult> {
  if (SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.SIGN_IN === 'disabled') {
    return authActionFailure('otp_disabled');
  }

  return sendPasswordlessEmail(email, false, nextPath);
}

/**
 * Send the configured passwordless signup email.
 */
export async function signUpWithEmail(email: string, nextPath: string | null = null): Promise<AuthActionResult> {
  if (SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.SIGN_UP === 'disabled') {
    return authActionFailure('otp_disabled');
  }

  return sendPasswordlessEmail(email, true, nextPath);
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

  const parsed = z
    .object({ email: signUpEmailSchema, password: signUpPasswordSchema })
    .safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return authActionFailure('validation_failed');
  const nextPath = getSafeNextPath(formData.get('next'));

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getSignUpConfirmationRedirect(nextPath),
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
export async function resendAccountConfirmEmail(email: string, nextPath: string | null = null) {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) return authActionFailure('validation_failed');
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsedEmail.data,
    options: {
      emailRedirectTo: getSignUpConfirmationRedirect(nextPath),
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
    redirectTo: getURL('/auth/callback?flow=recovery'),
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
  if (!passwordlessModeHasOtp(SC_CONFIG.AUTHENTICATION.SIGN_UP_EMAIL_VERIFICATION)) {
    return authActionFailure('otp_disabled');
  }

  const parsed = z.object({ email: emailSchema, token: otpSchema() }).safeParse({ email, token });
  if (!parsed.success) return authActionFailure('validation_failed');

  const supabase = await createClient();

  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (hasVerifiedSessionForEmail(existingUser, parsed.data.email)) {
    return authActionFailure('otp_already_verified');
  }

  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: 'signup',
  });

  if (error) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (hasVerifiedSessionForEmail(user, parsed.data.email)) {
      return authActionFailure('otp_already_verified');
    }

    return authActionFailure(error);
  }

  return authActionSuccess(null);
}

/** Verify a passwordless email sign-in code. */
export async function verifySignInOtp(email: string, token: string): Promise<AuthActionResult> {
  if (!passwordlessModeHasOtp(SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.SIGN_IN)) {
    return authActionFailure('otp_disabled');
  }

  const parsed = z.object({ email: emailSchema, token: otpSchema() }).safeParse({ email, token });
  if (!parsed.success) return authActionFailure('validation_failed');

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: 'email',
  });

  return error ? authActionFailure(error) : authActionSuccess(null);
}
