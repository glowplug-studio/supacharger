export type AccessBoundary = 'verified' | 'onboarded' | 'app';

export type AccessDecision = 'allow' | 'login' | 'onboarding' | 'billing';

export type AccessDecisionInput = {
  billingRequired: boolean;
  boundary: AccessBoundary;
  hasBillingAccess: boolean;
  isProfileComplete: boolean;
  isVerified: boolean;
  onboardingRequired: boolean;
};

/**
 * Resolves navigation policy without reading a session or issuing redirects.
 * Capability-specific handlers and database policies remain authoritative.
 */
export function decideAccess({
  billingRequired,
  boundary,
  hasBillingAccess,
  isProfileComplete,
  isVerified,
  onboardingRequired,
}: AccessDecisionInput): AccessDecision {
  if (!isVerified) return 'login';
  if (boundary === 'verified') return 'allow';
  if (onboardingRequired && !isProfileComplete) return 'onboarding';
  if (boundary === 'onboarded') return 'allow';
  if (billingRequired && !hasBillingAccess) return 'billing';
  return 'allow';
}
