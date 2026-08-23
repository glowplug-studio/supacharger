import { Flip, type ToastPosition } from 'react-toastify';

import type { SupachargerConfig } from '@/supacharger/supacharger-config-contract';
import { getSiteUrl } from '@/supacharger/utils/site-url';
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
export const SC_CONFIG: SupachargerConfig = {
  /**
   * ==========
   * STRINGS
   * ==========
   */

  //@toto this should be translatable! this has been done using en.json Global and in  src/app/(supacharger)/(unauthenticated)/account/login/page.tsx
  SITE_TITLE: 'Korunet',
  SITE_DESCRIPTION: 'Start your next project without reinventing the wheel.',
  SITE_LOGO: null,
  MARKETING_SITE_URL: null,
  METADATA: {
    SITE_URL: getSiteUrl(),
    TITLE_TEMPLATE: '%s | Korunet',
    INDEXING_ENABLED: process.env.VERCEL_ENV
      ? process.env.VERCEL_ENV === 'production'
      : process.env.NODE_ENV === 'production',
    FAVICON_SET_ENABLED: false,
    SOCIAL_IMAGE: null,
    COLOR_SCHEME: 'light dark',
    THEME_COLOR: null,
  },
  ROOT_PROVIDERS: {
    INTERNATIONALISATION: true,
    THEME: true,
    TOASTS: true,
  },
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || null,
    VERCEL_ANALYTICS_ENABLED: true,
  },

  AUTH_SESSION: {
    ALLOW_ANONYMOUS_USERS: false,
  },
  AUTHENTICATION: {
    EMAIL_PASSWORD: {
      SIGN_IN: true,
      SIGN_UP: true,
    },
    // Supabase sends links and codes through the same signInWithOtp request.
    // Keep OTP_LENGTH aligned with auth.email.otp_length in supabase/config.toml
    // and with the hosted project's Email OTP length.
    PASSWORDLESS_EMAIL: {
      SIGN_IN: 'otp',
      SIGN_UP: 'disabled',
      OTP_LENGTH: 6,
    },
    // Keep this aligned with Supabase Auth email-confirmation settings and templates.
    SIGN_UP_EMAIL_VERIFICATION: 'otp',
    MFA_TOTP: {
      ENABLED: false,
    },
  },
  // Enable this only after the production HTTPS domain and native identifiers
  // are ready. The shared routes then publish both platform association files.
  MOBILE_DEEP_LINKING: {
    ENABLED: false,
    ASSOCIATED_PATHS: ['/auth/callback', '/auth/confirm', '/account/reset-password/new'],
    IOS: {
      // Each value is <Apple App ID prefix>.<bundle identifier>.
      APP_IDS: [],
    },
    ANDROID: {
      APPS: [],
    },
  },

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

  PATH_AUTH_GUARD: {
    UNAUTHED_USER: {
      // Users without auth sessions can acess
      ALLOWED: [
        // Custom
        '/pricing',
        '/about',
        '/whats-included',
        '/paywall-demos',
        '/profile/:username',
        '/legal',
        '/license',
        '/error',
        '/auth/error',

        // Defaults
        '/',
        '/account/login',
        '/account/create',
        '/account/login-magic',
        '/account/reset-password',
        '/api/webhooks',
        '/api/account/request-password-reset',
        '/api/account/resend-activation-link',
        '/api/account/update-password',
        '/api/intl',
        '/auth/confirm',
        '/auth/callback',
      ],
      // Unauthenticated users cant visit these paths, important if AUTH_ONLY_APP is false.
      DISALLOWED: [
        //"/about"
      ],
    },
    AUTHED_USER: {
      // Paths authenticated users can not access
      DISALLOWED: [
        '/account/login',
        '/account/create',
        '/account/login-magic',
        '/account/reset-password',
        '/account/reset-password/:path*',
      ],
    },
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
      LOGIN_REDIRECT_DESTINATION: '/',
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

  // Username storage remains installed and nullable in every project. This policy
  // controls whether the application requests, displays, or requires the value.
  PROFILE_IDENTITY: {
    USERNAME: 'disabled',
    AVATAR: 'optional',
    HEADER_IMAGE: 'optional',
  },

  ACCOUNT_SETTINGS: {
    LANGUAGE: true,
    CANCEL_ACCOUNT: 'disabled',
    PRODUCT_PROFILE_PATH: null,
  },

  // The route belongs to the application. Supacharger only decides whether an
  // authenticated account must visit it before entering protected product routes.
  POST_SIGN_IN_ONBOARDING: {
    REQUIRED: false,
    REDIRECT_PATH: '/account/setup-profile',
  },

  // Organisation tables are always installed. Disabled applications do not expose
  // organisation fields or invoke organisation onboarding adapters.
  ORGANISATIONS: {
    ENABLED: false,
    AUTHENTICATION_HANDLE: 'disabled',
    CHOOSER_PATH: '/account/organisation',
    ROUTE_MODE: 'root-handle',
    PROFILE_MEDIA: true,
  },
  BILLING_ACCESS: {
    REQUIRED: false,
    // null means any active/trialling subscription. Set a feature lookup key
    // to authorise from the entitlement projection instead.
    FEATURE_LOOKUP_KEY: null as string | null,
    REDIRECT_PATH: '/account/billing/subscribe?full=1',
  },
  // Is there a required terms checkbox? null if not needed
  ACCOUNT_REQUIRED_TERMS_AGREEMENT_PATH: null,

  /**
   * ==========
   * Secuirty
   * ==========
   */

  // Allow emails with a + in them eg test+1@gmail.com
  EMAIL_ALLOW_PLUSADDRESSING: true,
  // Must match Supabase `auth.email.max_frequency`.
  EMAIL_RESEND_COOLDOWN_SECONDS: 60,
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
  PASSWORD_REQUIREMENTS: 'lower_upper_letters_digits' as SupachargerConfig['PASSWORD_REQUIREMENTS'],
  // minimum length
  PASSWORD_MINIMUM_LENGTH: 8,
  // if set the above two will be ignored. A generic failed message will be returned without reason if criteria not met.
  // eg string '^999' checks that the password must start with 999 and no further evaluation
  PASSWORD_CUSTOM_REGEX: null,
  /**
   * ==========
   * AUTHENTICATION Providers
   * ==========
   * Enable the matching provider and callback URL in Supabase before exposing it here.
   */
  AUTH_PROVDERS_ENABLED: {
    apple: false,
    azure: false,
    bitbucket: false,
    discord: false,
    facebook: true,
    figma: false,
    github: false,
    gitlab: false,
    google: true,
    kakao: false,
    keycloak: false,
    linkedin_oidc: false,
    notion: false,
    twitch: false,
    x: false,
    twitter: false,
    slack_oidc: false,
    slack: false,
    spotify: false,
    workos: false,
    zoom: false,
  },

  /**
   * ==========
   * Payments
   * ==========
   */
  // where does the
  STRIPE_PORTAL_LOGO_RETURN_PATH: 'account/billing',
  BILLING: {
    // Stripe chooses eligible local methods dynamically from Dashboard settings.
    AUTOMATIC_TAX: false,
    BILLING_ADDRESS_COLLECTION: 'auto' as 'auto' | 'required',
    ALLOW_PROMOTION_CODES: true,
    ACCOUNT_SUBJECTS: {
      PERSONAL: true,
      ORGANISATION: false,
    },
  },

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
};
