type AuthenticationMethodReference = {
  method?: unknown;
};

type ClaimsWithAuthenticationMethods = {
  amr?: unknown;
};

export function hasRecoveryAuthenticationMethod(claims: unknown): boolean {
  if (!claims || typeof claims !== 'object') return false;

  const methods = (claims as ClaimsWithAuthenticationMethods).amr;
  return Array.isArray(methods)
    && methods.some((entry: AuthenticationMethodReference) => entry?.method === 'recovery');
}
