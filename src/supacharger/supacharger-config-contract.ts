import type { ToastTransition } from 'react-toastify';

export type SupachargerOAuthProvider =
  | 'apple'
  | 'azure'
  | 'bitbucket'
  | 'discord'
  | 'facebook'
  | 'figma'
  | 'github'
  | 'gitlab'
  | 'google'
  | 'kakao'
  | 'keycloak'
  | 'linkedin_oidc'
  | 'notion'
  | 'twitch'
  | 'x'
  | 'twitter'
  | 'slack_oidc'
  | 'slack'
  | 'spotify'
  | 'workos'
  | 'zoom';

export type EmailPasswordlessMode = 'disabled' | 'link' | 'otp';
export type EmailOtpLength = 6 | 7 | 8 | 9 | 10;
export type SignUpEmailVerificationMode = EmailPasswordlessMode | 'otp-and-link';

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
  METADATA: {
    SITE_URL: string;
    TITLE_TEMPLATE: string;
    INDEXING_ENABLED: boolean;
    FAVICON_SET_ENABLED: boolean;
    SOCIAL_IMAGE: {
      URL: string;
      ALT: string;
      WIDTH: number;
      HEIGHT: number;
    } | null;
    COLOR_SCHEME: 'normal' | 'light' | 'dark' | 'light dark';
    THEME_COLOR:
      | string
      | {
          LIGHT: string;
          DARK: string;
        }
      | null;
  };
  ROOT_PROVIDERS: {
    INTERNATIONALISATION: boolean;
    THEME: boolean;
    TOASTS: boolean;
  };
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: string | null;
    VERCEL_ANALYTICS_ENABLED: boolean;
  };
  AUTH_SESSION: {
    VERIFICATION_MODE: 'claims' | 'user';
    ALLOW_ANONYMOUS_USERS: boolean;
  };
  AUTHENTICATION: {
    EMAIL_PASSWORD: {
      SIGN_IN: boolean;
      SIGN_UP: boolean;
    };
    PASSWORDLESS_EMAIL: {
      SIGN_IN: EmailPasswordlessMode;
      SIGN_UP: EmailPasswordlessMode;
      OTP_LENGTH: EmailOtpLength;
    };
    SIGN_UP_EMAIL_VERIFICATION: SignUpEmailVerificationMode;
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
      LOGIN_REDIRECT_DESTINATION: string;
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
  AUTH_PROVDERS_ENABLED: Readonly<Record<SupachargerOAuthProvider, boolean>>;
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
