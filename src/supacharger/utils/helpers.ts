import * as EmailValidator from 'email-validator';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

/** ==========
 *
 * Supacharger Helpers
 *
 * ========== */

/**
 *  Returns the full URL by appending the provided path to the base URL.
 * */
export function getURL(path = '') {
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
  const formattedURL = baseURL.startsWith('http') ? baseURL : `https://${baseURL}`;
  const cleanPath = path.replace(/^\/+/, '');
  return cleanPath ? `${formattedURL}/${cleanPath}` : formattedURL;
}

/**
 * @todo write this
 */
export function toDateTime(secs: number) {
  var t = new Date('1970-01-01T00:30:00Z'); // Unix epoch start.
  t.setSeconds(secs);
  return t;
}

export function getEnvVar(varValue: string | undefined, varName: string): string {
  if (varValue === undefined) throw new ReferenceError(`Reference to undefined env var: ${varName}`);
  return varValue;
}

/**
 *  Email Validation
 * */
export function isValidEmail(email: string): boolean {
  if (!EmailValidator.validate(email)) return false;
  if (!SC_CONFIG.EMAIL_ALLOW_PLUSADDRESSING && email.includes('+')) return false;
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
  validateNoRequired
};

// --- Main Pass Eval Function ---

export function evaluatePasswordStrength(password: string): PasswordValidationResult {
  const requirements = SC_CONFIG.PASSWORD_REQUIREMENTS;
  const minLength = SC_CONFIG.PASSWORD_MINIMUM_LENGTH;
  const customRegex = SC_CONFIG.PASSWORD_CUSTOM_REGEX;

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
export function supabaseErrorCodeLocalisation(response: string) {
  const errorMap: Record<string, string> = {
    invalid_credentials: 'invalidCredentials',
    email_not_confirmed: 'emailNotConfirmed',
    email_address_invalid: 'invalidEmail',
    user_not_found: 'userNotFound',
    over_request_rate_limit: 'overLimit',
    user_banned: 'userBanned',
    otp_expired: 'otpExpired',
    same_password: 'samePassword',
    AuthApiError: 'tokenAuthApiError',
    unexpected_failure: 'genericError',
    request_timeout: 'genericError',
    signup_auth_api_error: 'signupApiAuthError', // generic catch all for sign up errors.
    // Add more mappings as needed
  };

  return errorMap[response] || 'genericError';
}
