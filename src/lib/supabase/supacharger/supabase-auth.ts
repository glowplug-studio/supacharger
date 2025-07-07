'use server';

/** ==========
 *
 * Supacharger - Supabase Auth wrappers.
 *
 * ========== */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getURL } from '@/supacharger/utils/helpers';
import { ActionResponse } from '@/types/action-response';

import { createClient } from '../server';

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
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.code };
  }

  revalidatePath('/', 'layout');
  redirect(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATON);
}

/**
 * Sign / Sign Up wth Magic Link to email
 */
export async function signInWithEmail(email: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    return { data: null, error: error };
  }

  return { data: data, error: null };
}

/**
 * Create a new user with email password combo
 */
export async function createUserByEmailPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    return { data: null, error: error };
  }

  return { data: data, error: null };
}

/**
 *  Resends the activation email to unconfirmed users
 */
export async function resendAccountConfirmEmail(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: SC_CONFIG.ACCOUNT_CONFIRMED_PATH,
    },
  });

  return { data, error };
}

/**
 * Send password reset Link
 * redirects to the form to enter the new password
 */
export async function sendPasswordReset(email: string) {
  const supabase = await createClient();

  // Get the site URL from env
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Ensure no double slashes
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/account/reset-password/new`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { data, error };
}

//// @TODO the rest is questionable

export type SupabaseOAuthProvider =
  | 'apple'
  | 'azure'
  | 'bitbucket'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'gitlab'
  | 'google'
  | 'keycloak'
  | 'linkedin'
  | 'notion'
  | 'slack'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'workos'
  | 'zoom';

export async function signInWithOAuth(provider: SupabaseOAuthProvider): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
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

  if (error) {
    console.log(error);
    return false;
  }

  return data.user.aud == 'authenticated' ? true : false; // (data == 'authenticated')? true : false;
}

/**
 * Verify OTP (One-Time Password) for email verification
 * @param {string} email - The email address to verify
 * @param {string} token - The OTP token received via email
 * @returns {Promise<ActionResponse>} The verification response
 */
export async function verifyOtp(email: string, token: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

