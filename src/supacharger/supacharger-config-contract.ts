export type SupachargerOAuthProvider =
  | 'apple' | 'azure' | 'bitbucket' | 'discord' | 'facebook' | 'figma'
  | 'github' | 'gitlab' | 'google' | 'kakao' | 'keycloak' | 'linkedin_oidc'
  | 'notion' | 'twitch' | 'x' | 'twitter' | 'slack_oidc' | 'slack'
  | 'spotify' | 'workos' | 'zoom';

export type EmailPasswordlessMode = 'disabled' | 'link' | 'otp';
export type EmailOtpLength = 6 | 7 | 8 | 9 | 10;
export type SignUpEmailVerificationMode = EmailPasswordlessMode | 'otp-and-link';
export type SupachargerToastTransition = 'bounce' | 'flip' | 'slide' | 'zoom';

/** Canonical developer-owned Supacharger application configuration. */
export type SupachargerConfig = {
  /** Product name used by shared metadata and fallback presentation. */
  SITE_TITLE: string;
  /** Default product description used by shared metadata. */
  SITE_DESCRIPTION: string;
  /** Product logo sources and intrinsic ratio, or `null` when no shared logo is rendered. */
  SITE_LOGO: {
    /** URL used on light surfaces. */ LIGHT_MODE_SRC: string;
    /** URL used on dark surfaces. */ DARK_MODE_SRC: string;
    /** Source artwork width. */ WIDTH: number;
    /** Source artwork height. */ HEIGHT: number;
  } | null;
  /** Absolute marketing-site origin, or `null` when the application has no separate marketing site. */
  MARKETING_SITE_URL: string | null;
  /** Shared document metadata policy. */
  METADATA: {
    /** Canonical application origin. */ SITE_URL: string;
    /** Page-title template containing `%s`. */ TITLE_TEMPLATE: string;
    /** Whether search engines may index the application. */ INDEXING_ENABLED: boolean;
    /** Whether the standard favicon manifest is emitted. */ FAVICON_SET_ENABLED: boolean;
    /** Default social preview image, or `null` to omit it. */
    SOCIAL_IMAGE: { URL: string; ALT: string; WIDTH: number; HEIGHT: number } | null;
    /** Browser-supported colour-scheme declaration. */ COLOR_SCHEME: 'normal' | 'light' | 'dark' | 'light dark';
    /** One theme colour or separate light/dark values; `null` omits the tag. */
    THEME_COLOR: string | { LIGHT: string; DARK: string } | null;
  };
  /** Optional providers mounted by the developer-owned root layout. */
  ROOT_PROVIDERS: {
    /** Mount next-intl. */ INTERNATIONALISATION: boolean;
    /** Mount the application theme provider. */ THEME: boolean;
    /** Mount the managed toast container. */ TOASTS: boolean;
  };
  /** Optional analytics integrations. */
  ANALYTICS: {
    /** GA4 measurement ID, or `null` to disable GA4. */ GOOGLE_ANALYTICS_ID: string | null;
    /** Enable Vercel Web Analytics. */ VERCEL_ANALYTICS_ENABLED: boolean;
  };
  /** Session acceptance policy. */
  AUTH_SESSION: {
    /** Permit Supabase anonymous identities as signed-in users. */ ALLOW_ANONYMOUS_USERS: boolean;
  };
  /** Authentication methods and verification policy. */
  AUTHENTICATION: {
    /** Password credential availability. */
    EMAIL_PASSWORD: { /** Show/accept password sign-in. */ SIGN_IN: boolean; /** Show/accept password signup. */ SIGN_UP: boolean };
    /** Exclusive passwordless email modes. */
    PASSWORDLESS_EMAIL: {
      /** `disabled`, `link`, or `otp` for sign-in. */ SIGN_IN: EmailPasswordlessMode;
      /** `disabled`, `link`, or `otp` for signup. */ SIGN_UP: EmailPasswordlessMode;
      /** Code length; keep local and hosted Supabase Auth equal. */ OTP_LENGTH: EmailOtpLength;
    };
    /** `disabled`, `link`, `otp`, or `otp-and-link`; keep hosted templates aligned. */
    SIGN_UP_EMAIL_VERIFICATION: SignUpEmailVerificationMode;
    /** Supabase Auth authenticator-app MFA policy. */
    MFA_TOTP: {
      /** Require AAL2 after sign-in for accounts with a verified factor. */ REQUIRED_FOR_SIGN_IN: boolean;
    };
  };
  /** Native-app callback association documents and identifiers. */
  MOBILE_DEEP_LINKING: {
    /** Publish the association routes. */ ENABLED: boolean;
    /** Web callback paths the native applications may claim. */ ASSOCIATED_PATHS: readonly string[];
    /** Apple application identifiers. */ IOS: { APP_IDS: readonly string[] };
    /** Android package names and signing fingerprints. */
    ANDROID: { APPS: readonly { PACKAGE_NAME: string; SHA256_CERT_FINGERPRINTS: readonly string[] }[] };
  };
  /** Protect all non-allowlisted application routes when `true`. */ AUTH_ONLY_APP: boolean;
  /** Exact and parameterised Proxy route policy. */
  PATH_AUTH_GUARD: {
    /** Rules for requests without a verified session. */
    UNAUTHED_USER: { /** Public paths. */ ALLOWED: readonly string[]; /** Explicitly blocked paths. */ DISALLOWED: readonly string[] };
    /** Rules for requests with a verified session. */
    AUTHED_USER: { /** Auth pages a signed-in user cannot visit. */ DISALLOWED: readonly string[] };
  };
  /** Safe application-relative navigation destinations. */
  USER_REDIRECTS: {
    UNAUTHED_USER: {
      /** Public home path. */ HOME_PATH: string;
      /** Destination when a protected route is requested. */ AUTHGUARD_REDIRECT_DESTINATION: string;
      /** Destination after logout. */ LOGOUT_REDIRECT_DESTINATON: string;
    };
    AUTHED_USER: {
      /** Authenticated home path. */ HOME_PATH: string;
      /** Destination when an Auth page is requested. */ AUTHGUARD_REDIRECT_DESTINATION: string;
      /** Normal successful sign-in destination. */ LOGIN_REDIRECT_DESTINATION: string;
    };
  };
  /** Destination after signup confirmation; may include the one-time success notice query. */
  ACCOUNT_CONFIRMED_PATH: string;
  /** Profile field visibility/requirement policy. */
  PROFILE_IDENTITY: {
    /** `disabled`, `optional`, or `required`; storage stays installed. */ USERNAME: 'disabled' | 'optional' | 'required';
    /** `disabled` or `optional`; no required media mode exists. */ AVATAR: 'disabled' | 'optional';
    /** `disabled` or `optional`; no `enabled` value exists. */ HEADER_IMAGE: 'disabled' | 'optional';
  };
  /** Post-sign-in profile-completion routing. */
  POST_SIGN_IN_ONBOARDING: {
    /** Enforce canonical profile completion before full application access. */ REQUIRED: boolean;
    /** Verified-only recovery path outside the onboarding guard. */ REDIRECT_PATH: string;
  };
  /** Organisation feature exposure; schema remains installed in every mode. */
  ORGANISATIONS: {
    /** Expose organisation journeys and context actions. */ ENABLED: boolean;
    /** `disabled`, `optional`, or `required` handle input during authentication. */ AUTHENTICATION_HANDLE: 'disabled' | 'optional' | 'required';
    /** Canonical organisation chooser route. */ CHOOSER_PATH: '/account/organisation';
    /** Organisation URLs use a root `[handle]` segment. */ ROUTE_MODE: 'root-handle';
    /** Expose organisation avatar/header media. */ PROFILE_MEDIA: boolean;
  };
  /** OAuth connections used by external coding agents and MCP clients. */
  AGENT_CONNECTIONS: {
    /** Expose agent consent and management UI and permit agent database access. */ ENABLED: boolean;
  };
  /** Optional account-settings sections. */
  ACCOUNT_SETTINGS: {
    /** Show and persist language preference. */ LANGUAGE: boolean;
    /** `hidden`, honest `disabled`, or functional `enabled` cancellation UI. */ CANCEL_ACCOUNT: 'hidden' | 'disabled' | 'enabled';
    /** Product-profile route added to account navigation; `null` hides it. */ PRODUCT_PROFILE_PATH: string | null;
  };
  /** Full-product billing access gate, independent of the billing settings page. */
  BILLING_ACCESS: {
    /** Require an eligible billing state after authentication/onboarding. */ REQUIRED: boolean;
    /** `null` accepts any active/trialling subscription; a string requires that entitlement key. */ FEATURE_LOOKUP_KEY: string | null;
    /** Onboarded acquisition path outside the full-access guard. */ REDIRECT_PATH: string;
  };
  /** Terms URL for a required signup checkbox, or `null` for no checkbox. */ ACCOUNT_REQUIRED_TERMS_AGREEMENT_PATH: string | null;
  /** Permit `+tag` email addresses. */ EMAIL_ALLOW_PLUSADDRESSING: boolean;
  /** UI resend cooldown in seconds; never shorter than hosted Auth limits. */ EMAIL_RESEND_COOLDOWN_SECONDS: number;
  /** Built-in password rule set; ignored when `PASSWORD_CUSTOM_REGEX` is set. */
  PASSWORD_REQUIREMENTS: 'no_required' | 'letters_digits' | 'lower_upper_letters_digits' | 'lower_upper_letters_digits_symbols';
  /** Minimum password length used by client and authoritative server validation. */ PASSWORD_MINIMUM_LENGTH: number;
  /** Optional regex source used by client and server; `null` selects built-in rules. */ PASSWORD_CUSTOM_REGEX: string | null;
  /** Complete provider enablement map; hosted provider configuration is separate. */
  AUTH_PROVDERS_ENABLED: Readonly<Record<SupachargerOAuthProvider, boolean>>;
  /** Application-relative Stripe Portal return path. */ STRIPE_PORTAL_LOGO_RETURN_PATH: string;
  /** Shared Stripe billing policy. */
  BILLING: {
    /** Ask Stripe to calculate automatic tax. */ AUTOMATIC_TAX: boolean;
    /** Stripe Checkout address collection mode. */ BILLING_ADDRESS_COLLECTION: 'auto' | 'required';
    /** Allow valid promotion codes at Checkout. */ ALLOW_PROMOTION_CODES: boolean;
    /** Billing subjects exposed by the product. */
    ACCOUNT_SUBJECTS: { /** Personal billing. */ PERSONAL: boolean; /** Organisation billing. */ ORGANISATION: boolean };
  };
  /** Serializable React-Toastify presentation settings. */
  TOAST_CONFIG: {
    /** Viewport position. */ position: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    /** Auto-dismiss milliseconds, or `false` to persist. */ autoClose: number | false;
    /** Hide the timer bar. */ hideProgressBar: boolean;
    /** Dismiss on click. */ closeOnClick: boolean;
    /** Pause while hovered. */ pauseOnHover: boolean;
    /** Permit drag dismissal. */ draggable: boolean;
    /** Controlled progress from 0 to 1, or `undefined`. */ progress: number | undefined;
    /** Toast colour theme. */ theme: 'light' | 'dark' | 'colored';
    /** Client-mapped transition name; server config never imports a React component. */ transition: SupachargerToastTransition;
  };
};
