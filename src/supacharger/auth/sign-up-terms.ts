/** Accept only absolute web URLs; null disables the notice. */
export function signUpTermsUrl(value: string | null | undefined): string | null {
  if (!value || !/^https?:\/\//i.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function signUpTermsMessage(password: boolean, passwordless: boolean, social: boolean) {
  if (social && !password && !passwordless) return 'signUpTermsSocialOnly';
  if (social) return password ? 'signUpTermsSocial' : 'signUpTermsPasswordlessSocial';
  return password ? 'signUpTerms' : 'signUpTermsPasswordless';
}
