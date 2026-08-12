import { Flip, type ToastPosition } from 'react-toastify';
/**
 * ==========
 *    ___
 *   /  _|__ _ _ __ __ _ __| |_ __ _ _ _ __ _ ___ _ ___
 *  \__ \ || | '_ \/ _` / _| ' \/ _` | '_/ _` / -_ ) '_/
 *  |___/\_,_| .__/\__,_\__|_||_\__,_|_| \__, \___|_|
 *           |_|                         |___/
 *
 * Super, Supacharger Project Configuration
 * ========== */

/**
 * ==========
 * Supacharger Configuration
 * ==========
 */
export const SC_CONFIG = {
  /**
   * ==========
   * STRINGS
   * ==========
   */

  //@toto this should be translatable! this has been done using en.json Global and in  src/app/(supacharger)/(unauthenticated)/account/login/page.tsx
  SITE_TITLE: 'Korunet',
  SITE_DESCRIPTION: 'Start your next project without reinventing the wheel.',

  /**
   * ==========
   * PATHS
   * ==========
   *
   * Always include the leading slash!
   * for wildcard routes add /:path*
   */
  // protect all routes except the exceptions in NO_SESSION_USER_ALLOWED_PATHS
  AUTH_ONLY_APP: true,

  PATH_AUTH_GARD: {
      UNAUTHED_USER: {
         // Users without auth sessions can acess
        ALLOWED: [

          // Custom
          "/pricing",
          "/about",
          "/user/:username",
          "/legal",

          // Defaults
          "/",
          "/account/login",
          "/account/create",
          "/account/login-magic",
          "/account/reset-password",
          "/api/webhooks",
          "/api/account/request-password-reset",
          "/api/account/resend-activation-link",
          "/api/account/update-password",
          "/auth/confirm",
          "/auth/callback"
        ],
        // Unauthenticated users cant visit these paths, important if AUTH_ONLY_APP is false.
        DISALLOWED: [
           //"/about"
        ],
      },
      AUTHED_USER:{
        // Paths authenticated users can not access
        DISALLOWED: [
          '/account/login',
          '/account/create',
          '/account/login-magic',
          '/account/reset-password',
          '/account/reset-password/:path*',
        ]
      }
    },
  USER_REDIRECTS: {
    UNAUTHED_USER: {
        // Which path is considered "home" for unauthenticated users
      HOME_PATH: '/',
      // Which path unauthenticated users are redirected to when requesting an auth protected page
      AUTHGUARD_REDIRECT_DESTINATION: '/account/login',
      LOGOUT_REDIRECT_DESTINATON: '/',
    },
    AUTHED_USER: {
      // Where to go after successful authentication flow, the path considered "home" for authenticated users
      HOME_PATH: '/',
      // Which path authenticated users are redirected to when requesting an auth protected page
      AUTHGUARD_REDIRECT_DESTINATION: '/',
        // Where to go after successful authentication flow
      LOGIN_REDIRECT_DESTINATON: '/',
    },
  },

  /**
   * ==========
   * Registration Settings
   * ==========
   *
   */
  // where to redirect the user when their account is confirmed via OTP or link - keep the parameter ?account_confirmed=1
  // an example handler is in src/components/sc_demo/sc_user-dash.tsx
  ACCOUNT_CONFIRMED_PATH: '/?account_confirmed=1',

  // are there steps a user must go through before they can access the application
  // null to disable
  ACCOUNT_CREATION_STEPS_URL: '/account/setup/1',
      // Is a valid subscription required to use the authed area?
  ACCOUNT_FORCE_SUBSCRIPTION: true,
  // Where to send authed users who haven't got a subscription
  ACCOUNT_ENFORCE_SUBSCRIPTION_PATH: '/account/billing/subscribe?full=1',
    // Is there a required terms checkbox? null if not needed
  ACCOUNT_REQUIRED_TERMS_AGREEMENT_PATH: null,

  /**
   * ==========
   * Secuirty
   * ==========
   */

  // Allow emails with a + in them eg test+1@gmail.com
  EMAIL_ALLOW_PLUSADDRESSING: true,
  /**
   *
   * Password Strength Settings
   *
    Used for front end, server side password validation on signup and password change

    Options:
    no_reuqired: no required chars
    letters_digits: letters and digits
    lower_upper_letters_digits
    lower_upper_letters_digits_symbols
  */
  PASSWORD_REQUIREMENTS: 'lower_upper_letters_digits',
  // minimum length
  PASSWORD_MINIMUM_LENGTH: 8,
  // if set the above two will be ignored. A generic failed message will be returned without reason if criteria not met.
  // eg string '^999' checks that the password must start with 999 and no further evaluation
  PASSWORD_CUSTOM_REGEX: null,
  /**
   * ==========
   * AUTHENTICATION Providers
   * ==========
   *
   * Only the providers listed here are supported at this point in time.
   */
  AUTH_PROVDERS_ENABLED: {
    google: true,
    facebook: true,
  },

    /**
   * ==========
   * Payments
   * ==========
   */
  // where does the 
  STRIPE_PORTAL_LOGO_RETURN_PATH: 'account/billing',

  /**
   * ==========
   * UI
   * ==========
   */

  TOAST_CONFIG: {
    position: 'bottom-center' as ToastPosition,
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    transition: Flip,
  },
  /**
   * ==========
   * CLI - do not edit
   * ==========
   */
  CLI_INSTALL_HASH: 'c4bcd3fda8b7e68c5b33708930c62a626971f51c',
};
