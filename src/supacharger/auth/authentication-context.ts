export type AuthenticationContextField = {
  autoComplete?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

export type AuthenticationContextAdapter = {
  fields: readonly AuthenticationContextField[];
  selectAfterSignIn(values: Readonly<Record<string, string>>): Promise<void>;
};

export type PostSignInOnboardingAdapter = {
  fields: readonly AuthenticationContextField[];
  complete(values: Readonly<Record<string, string>>): Promise<{
    destination?: string;
  } | void>;
};
