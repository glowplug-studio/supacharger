import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import 'server-only';

export type VerifiedUserIdentity = {
  claims: Record<string, unknown> & { sub: string };
  userId: string;
};

export type AppAccessState = VerifiedUserIdentity & {
  hasBillingAccess: boolean;
  isProfileComplete: boolean;
};

export async function requireVerifiedUser(): Promise<VerifiedUserIdentity> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || typeof claims?.sub !== 'string' || claims.role !== 'authenticated') {
    redirect(SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION);
  }

  if (!SC_CONFIG.AUTH_SESSION.ALLOW_ANONYMOUS_USERS && claims.is_anonymous === true) {
    redirect(SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION);
  }

  return {
    claims: claims as Record<string, unknown> & { sub: string },
    userId: claims.sub,
  };
}

export async function readAppAccessState(): Promise<AppAccessState> {
  const identity = await requireVerifiedUser();
  const supabase = await createClient();

  const [profileResult, billingResult] = await Promise.all([
    SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED
      ? supabase.schema('api').rpc('is_profile_complete_by_current_user', {
          input_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
        })
      : Promise.resolve({ data: true, error: null }),
    SC_CONFIG.BILLING_ACCESS.REQUIRED
      ? supabase.schema('api').rpc('has_billing_access_by_current_user', {
          input_feature_lookup_key: SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY ?? undefined,
        })
      : Promise.resolve({ data: true, error: null }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (billingResult.error) throw billingResult.error;

  return {
    ...identity,
    hasBillingAccess: billingResult.data === true,
    isProfileComplete: profileResult.data === true,
  };
}

export async function requireAppAccess(): Promise<AppAccessState> {
  const access = await readAppAccessState();

  if (!access.isProfileComplete) {
    redirect(SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH);
  }

  if (!access.hasBillingAccess) {
    redirect(SC_CONFIG.BILLING_ACCESS.REDIRECT_PATH);
  }

  return access;
}
