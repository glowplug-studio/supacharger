const sensitiveAuthQueryKeys = [
  'email',
  'password',
  'repeat-password',
  'organisation-title',
  'organisation-handle',
  'organisation-colour',
  'mfa-code',
] as const;

const authenticationPathPrefixes = ['/account', '/auth'] as const;

export function hasSensitiveAuthQuery(pathname: string, searchParams: URLSearchParams) {
  const isAuthenticationPath = authenticationPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return isAuthenticationPath && sensitiveAuthQueryKeys.some((key) => searchParams.has(key));
}

export function removeSensitiveAuthQuery(searchParams: URLSearchParams) {
  sensitiveAuthQueryKeys.forEach((key) => searchParams.delete(key));
}
