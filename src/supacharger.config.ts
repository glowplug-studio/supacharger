import type { SupachargerConfig } from '@/supacharger/supacharger-config-contract';
import { getSiteUrl } from '@/supacharger/utils/site-url';
/**
 * ==========
 *
 *   ▗▄▄▖▗▖ ▗▖▗▄▄▖  ▗▄▖  ▗▄▄▖▗▖ ▗▖ ▗▄▖ ▗▄▄▖  ▗▄▄▖▗▄▄▄▖▗▄▄▖
 *  ▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌   ▐▌ ▐▌
 *   ▝▀▚▖▐▌ ▐▌▐▛▀▘ ▐▛▀▜▌▐▌   ▐▛▀▜▌▐▛▀▜▌▐▛▀▚▖▐▌▝▜▌▐▛▀▀▘▐▛▀▚▖
 *  ▗▄▄▞▘▝▚▄▞▘▐▌   ▐▌ ▐▌▝▚▄▄▖▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌▝▚▄▞▘▐▙▄▄▖▐▌ ▐▌
 *
 *  Supacharger Project Configuration
 *
 * ========== */

/**
 * ==========
 * Supacharger Configuration
 * ==========
 */
export const SC_CONFIG: SupachargerConfig = {
  // Identity and shared service selection.
  PROJECT_NAMESPACE: '',
  CORE_SERVICES: {
    auth: { provider: 'supabase' },
    transactional_email: { provider: null },
  },
  // English fallbacks; translate Global.siteTitle and Global.siteDescription in messages/.
  SITE_TITLE: 'Korunet',
  SITE_DESCRIPTION: 'Start your next project without reinventing the wheel.',
  MARKETING_SITE_URL: null,
  // Site-wide metadata defaults. Pages may override their OG image.
  METADATA: {
    SITE_URL: getSiteUrl(),
    INDEXING_ENABLED: process.env.VERCEL_ENV
      ? process.env.VERCEL_ENV === 'production'
      : process.env.NODE_ENV === 'production',
    FAVICON_SET_ENABLED: false,
    DEFAULT_OG_IMAGE: { DEFAULT: null, LOCALES: {} },
    COLOR_SCHEME: 'light dark',
    THEME_COLOR: null,
  },
  // Provider-independent signup consent and account navigation.
  AUTHENTICATION: {
    SIGN_UP_TERMS: { REQUIRED: false, URL: { DEFAULT: '/legal', LOCALES: {} } },
    ACCOUNT_CONFIRMED_PATH: '/?account_confirmed=1',
  },
  // Settings used specifically by the Supabase Auth implementation.
  SUPABASE_AUTH: {
    SESSION: {
      ALLOW_ANONYMOUS_USERS: false,
    },
    METHODS: {
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
        REQUIRED_FOR_SIGN_IN: false,
      },
      CROSS_DEVICE_SESSION_TRANSFER: {
        ENABLED: false,
        TOKEN_TTL_SECONDS: 120,
      },
    },
    OAUTH_PROVIDERS: {
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
    EMAIL: { ALLOW_PLUS_ADDRESSING: true, RESEND_COOLDOWN_SECONDS: 60 },
    PASSWORD: { REQUIREMENTS: 'lower_upper_letters_digits', MINIMUM_LENGTH: 8, CUSTOM_REGEX: null },
  },
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
        '/features/:path*',
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
        '/auth/session-transfer',
        '/api/auth/session-transfers/redeem',
      ],
      // Unauthenticated users cant visit these paths, important if AUTH_ONLY_APP is false.
      DISALLOWED: [
        //"/about"
      ],
    },
    AUTHED_USER: {
      // Paths authenticated users can not access
      DISALLOWED: ['/account/login', '/account/create', '/account/login-magic', '/account/reset-password'],
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
  MOBILE_DEEP_LINKING: {
    ENABLED: false,
    ASSOCIATED_PATHS: ['/auth/callback', '/auth/confirm'],
    IOS: {
      // Each value is <Apple App ID prefix>.<bundle identifier>.
      APP_IDS: [],
    },
    ANDROID: {
      APPS: [],
    },
  },
  PROFILE_IDENTITY: {
    USERNAME: 'disabled',
    AVATAR: 'optional',
    HEADER_IMAGE: 'optional',
  },
  POST_SIGN_IN_ONBOARDING: {
    REQUIRED: false,
    REDIRECT_PATH: '/account/setup-profile',
  },
  ACCOUNT_SETTINGS: {
    LANGUAGE: true,
    CANCEL_ACCOUNT: 'disabled',
    PRODUCT_PROFILE_PATH: null,
  },
  ORGANISATIONS: {
    ENABLED: true,
    AUTHENTICATION_HANDLE: 'disabled',
    CHOOSER_PATH: '/organisation/choose',
    ROUTE_MODE: 'organisation-handle',
    PROFILE_MEDIA: true,
  },
  BILLING_ACCESS: {
    REQUIRED: false,
    // null means any active/trialling subscription. Set a feature lookup key
    // to authorise from the entitlement projection instead.
    FEATURE_LOOKUP_KEY: null as string | null,
    REDIRECT_PATH: '/account/billing/subscribe?full=1',
  },
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
  ROOT_PROVIDERS: {
    INTERNATIONALISATION: true,
    THEME: true,
    TOASTS: true,
  },
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || null,
    VERCEL_ANALYTICS_ENABLED: true,
  },
  TOAST_CONFIG: {
    position: 'bottom-center',
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    // Client code maps this serialisable key to react-toastify's transition component.
    transition: 'flip',
  },
};
