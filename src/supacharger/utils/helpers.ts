import * as EmailValidator from 'email-validator';

export { stripeUnixToDate as toDateTime } from '@/lib/stripe/stripe-time';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export { getSiteUrl, getURL } from '@/supacharger/utils/site-url';

/** ==========
 *
 * Supacharger Helpers
 *
 * ========== */

export function getEnvVar(varValue: string | undefined, varName: string): string {
  const value = varValue?.trim();
  if (!value) throw new ReferenceError(`Reference to undefined or empty env var: ${varName}`);
  return value;
}

export function getSupabaseUrl(): string {
  return getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabasePublishableKey(): string {
  return getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

/**
 *  Email Validation
 * */
export function isValidEmail(email: string): boolean {
  if (!EmailValidator.validate(email)) return false;
  if (!SC_CONFIG.SUPABASE_AUTH.EMAIL.ALLOW_PLUS_ADDRESSING && email.includes('+')) return false;
  return true;
}

/**
 *  Password Validation
 * */
interface PasswordValidationResult {
  valid: boolean;
  message: string;
}

// --- Individual Validators (return boolean only) ---

export const hasLowercase = (password: string) => /[a-z]/.test(password);
export const hasUppercase = (password: string) => /[A-Z]/.test(password);
export const hasDigit = (password: string) => /\d/.test(password);
export const hasLetter = (password: string) => /[A-Za-z]/.test(password);
export const hasSpecial = (password: string) => /[^A-Za-z0-9]/.test(password);

function validateNoRequired(_password: string): boolean {
  return true;
}

function validateLettersDigits(password: string): boolean {
  return /(?=.*[A-Za-z])(?=.*\d)/.test(password);
}

function validateLowerUpperLettersDigits(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password);
}

function validateLowerUpperLettersDigitsSymbols(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/.test(password);
}

export {
  validateLettersDigits,
  validateLowerUpperLettersDigits,
  validateLowerUpperLettersDigitsSymbols,
  validateNoRequired,
};

// --- Main Pass Eval Function ---

export function evaluatePasswordStrength(password: string): PasswordValidationResult {
  const requirements = SC_CONFIG.SUPABASE_AUTH.PASSWORD.REQUIREMENTS;
  const minLength = SC_CONFIG.SUPABASE_AUTH.PASSWORD.MINIMUM_LENGTH;
  const customRegex = SC_CONFIG.SUPABASE_AUTH.PASSWORD.CUSTOM_REGEX;

  // Custom regex takes precedence
  if (customRegex) {
    const regex = new RegExp(customRegex);
    if (regex.test(password)) {
      return { valid: true, message: 'valid' };
    }
    return { valid: false, message: 'password_failed_regex_evaluation' };
  }

  // Minimum length check
  if (password.length < minLength) {
    return { valid: false, message: 'passwordTooShort' };
  }

  // Dispatch to the right validator
  switch (requirements) {
    case 'no_required':
      return { valid: validateNoRequired(password), message: 'valid' };
    case 'letters_digits':
      return validateLettersDigits(password)
        ? { valid: true, message: 'valid' }
        : { valid: false, message: 'mustContainLetterDigit' };
    case 'lower_upper_letters_digits':
      return validateLowerUpperLettersDigits(password)
        ? { valid: true, message: 'valid' }
        : { valid: false, message: 'mustContainLowerLetterUpperLetterDigit' };
    case 'lower_upper_letters_digits_symbols':
      return validateLowerUpperLettersDigitsSymbols(password)
        ? { valid: true, message: 'valid' }
        : { valid: false, message: 'mustContainLowerLetterUpperLetterDigitSymbol' };
    default:
      return { valid: false, message: 'Invalid password requirements configuration.' };
  }
}

/**
 * Returns a next-intl Message string based on the current locale.
 */
export function supabaseErrorCodeLocalisation(response: string, status: number | null = null) {
  const errorMap: Record<string, string> = {
    invalid_credentials: 'invalidCredentials',
    email_not_confirmed: 'emailNotConfirmed',
    email_address_invalid: 'invalidEmail',
    email_address_not_authorized: 'emailAddressNotAuthorized',
    email_exists: 'accountAlreadyExists',
    user_already_exists: 'accountAlreadyExists',
    email_provider_disabled: 'emailProviderDisabled',
    email_password_sign_in_disabled: 'emailProviderDisabled',
    email_password_sign_up_disabled: 'emailProviderDisabled',
    signup_disabled: 'signupDisabled',
    weak_password: 'weakPassword',
    validation_failed: 'validationFailed',
    terms_required: 'termsRequired',
    user_not_found: 'userNotFound',
    over_email_send_rate_limit: 'overEmailSendRateLimit',
    over_request_rate_limit: 'overLimit',
    user_banned: 'userBanned',
    otp_disabled: 'otpDisabled',
    otp_expired: 'otpExpired',
    otp_already_verified: 'otpAlreadyVerified',
    magic_link_disabled: 'emailProviderDisabled',
    oauth_provider_disabled: 'providerDisabled',
    oauth_provider_not_supported: 'providerDisabled',
    provider_disabled: 'providerDisabled',
    same_password: 'samePassword',
    AuthApiError: 'tokenAuthApiError',
    unexpected_failure: 'genericError',
    request_timeout: 'genericError',
    refresh_temporarily_unavailable: 'authTemporarilyUnavailable',
    signup_auth_api_error: 'signupApiAuthError', // generic catch all for sign up errors.
    // Add more mappings as needed
  };

  return errorMap[response] || (status === 429 ? 'overLimit' : 'genericError');
}

export function supabaseErrorCodeFallback(messageKey: string) {
  const fallbackMessages: Record<string, string> = {
    emailAddressNotAuthorized:
      'This project cannot send email to that address. Configure custom SMTP in Supabase or use an authorised address.',
    accountAlreadyExists: 'An account already exists for this email address.',
    emailProviderDisabled: 'Email authentication is currently disabled.',
    signupDisabled: 'New account registration is currently disabled.',
    weakPassword: "That password does not meet the server's password requirements.",
    validationFailed: 'The authentication details are not in the expected format.',
    overEmailSendRateLimit:
      'Too many verification emails have been sent. Please wait a few minutes before trying again.',
    otpDisabled: 'Email verification codes are currently disabled.',
    providerDisabled: 'That sign-in provider is currently disabled.',
    overLimit: 'Too many requests. Please wait a few minutes and try again.',
    genericError: 'There was an unexpected problem.',
    authTemporarilyUnavailable: 'Authentication is temporarily unavailable. Please wait 30 seconds and try again.',
  };

  return fallbackMessages[messageKey] ?? fallbackMessages.genericError;
}
