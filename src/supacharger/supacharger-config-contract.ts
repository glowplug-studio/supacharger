import type { ToastTransition } from 'react-toastify';

export type SupachargerConfig = {
  SITE_TITLE: string;
  SITE_DESCRIPTION: string;
  SITE_LOGO: {
    LIGHT_MODE_SRC: string;
    DARK_MODE_SRC: string;
    WIDTH: number;
    HEIGHT: number;
  } | null;
  MARKETING_SITE_URL: string | null;
  AUTH_SESSION: {
    VERIFICATION_MODE: 'claims' | 'user';
    ALLOW_ANONYMOUS_USERS: boolean;
  };
  AUTHENTICATION: {
    EMAIL_PASSWORD: {
      SIGN_IN: boolean;
      SIGN_UP: boolean;
    };
    MAGIC_LINK: {
      ENABLED: boolean;
      ALLOW_SIGN_UP: boolean;
    };
    SIGN_UP_EMAIL_VERIFICATION: 'disabled' | 'link' | 'otp';
    MFA_TOTP: {
      ENABLED: boolean;
    };
  };
  MOBILE_DEEP_LINKING: {
    ENABLED: boolean;
    ASSOCIATED_PATHS: readonly string[];
    IOS: {
      APP_IDS: readonly string[];
    };
    ANDROID: {
      APPS: readonly {
        PACKAGE_NAME: string;
        SHA256_CERT_FINGERPRINTS: readonly string[];
      }[];
    };
  };
  AUTH_ONLY_APP: boolean;
  PATH_AUTH_GUARD: {
    UNAUTHED_USER: {
      ALLOWED: readonly string[];
      DISALLOWED: readonly string[];
    };
    AUTHED_USER: {
      DISALLOWED: readonly string[];
    };
  };
  USER_REDIRECTS: {
    UNAUTHED_USER: {
      HOME_PATH: string;
      AUTHGUARD_REDIRECT_DESTINATION: string;
      LOGOUT_REDIRECT_DESTINATON: string;
    };
    AUTHED_USER: {
      HOME_PATH: string;
      AUTHGUARD_REDIRECT_DESTINATION: string;
      LOGIN_REDIRECT_DESTINATON: string;
    };
  };
  ACCOUNT_CONFIRMED_PATH: string;
  PROFILE_IDENTITY: {
    USERNAME: 'disabled' | 'optional' | 'required';
  };
  POST_SIGN_IN_ONBOARDING: {
    REQUIRED: boolean;
    REDIRECT_PATH: string;
  };
  ORGANISATIONS: {
    ENABLED: boolean;
    AUTHENTICATION_HANDLE: 'disabled' | 'optional' | 'required';
  };
  BILLING_ACCESS: {
    REQUIRED: boolean;
    FEATURE_LOOKUP_KEY: string | null;
    REDIRECT_PATH: string;
  };
  ACCOUNT_FORCE_SUBSCRIPTION: boolean;
  ACCOUNT_ENFORCE_SUBSCRIPTION_PATH: string;
  ACCOUNT_REQUIRED_TERMS_AGREEMENT_PATH: string | null;
  EMAIL_ALLOW_PLUSADDRESSING: boolean;
  EMAIL_RESEND_COOLDOWN_SECONDS: number;
  PASSWORD_REQUIREMENTS:
    | 'no_required'
    | 'letters_digits'
    | 'lower_upper_letters_digits'
    | 'lower_upper_letters_digits_symbols';
  PASSWORD_MINIMUM_LENGTH: number;
  PASSWORD_CUSTOM_REGEX: string | null;
  AUTH_PROVDERS_ENABLED: {
    google: boolean;
    facebook: boolean;
  };
  STRIPE_PORTAL_LOGO_RETURN_PATH: string;
  BILLING: {
    AUTOMATIC_TAX: boolean;
    BILLING_ADDRESS_COLLECTION: 'auto' | 'required';
    ALLOW_PROMOTION_CODES: boolean;
  };
  TOAST_CONFIG: {
    position:
      | 'top-left'
      | 'top-right'
      | 'top-center'
      | 'bottom-left'
      | 'bottom-right'
      | 'bottom-center';
    autoClose: number | false;
    hideProgressBar: boolean;
    closeOnClick: boolean;
    pauseOnHover: boolean;
    draggable: boolean;
    progress: number | undefined;
    theme: 'light' | 'dark' | 'colored';
    transition: ToastTransition;
  };
};
