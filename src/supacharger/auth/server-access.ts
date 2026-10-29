import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { decideAccess } from '@/supacharger/auth/access-decision';
import { schemaName } from '@/supacharger/namespace';
import { initialiseAccountUsername } from '@/supacharger/profile/initialise-account-username';
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

export type OnboardedUserIdentity = VerifiedUserIdentity & {
  isProfileComplete: true;
};

export async function requireVerifiedUser(): Promise<VerifiedUserIdentity> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || typeof claims?.sub !== 'string' || claims.role !== 'authenticated') {
    redirect(SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION);
  }

  if (!SC_CONFIG.SUPABASE_AUTH.SESSION.ALLOW_ANONYMOUS_USERS && claims.is_anonymous === true) {
    redirect(SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION);
  }

  return {
    claims: claims as Record<string, unknown> & { sub: string },
    userId: claims.sub,
  };
}

export async function readAppAccessState(): Promise<AppAccessState> {
  const identity = await requireVerifiedUser();
  if (identity.claims.is_anonymous !== true) await initialiseAccountUsername(await createClient());
  const supabase = await createClient();

  const profileResult = SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED
    ? await supabase.schema(schemaName('api')).rpc('is_profile_complete_by_current_user', {
        input_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
      })
    : { data: true, error: null };

  if (profileResult.error) throw profileResult.error;

  const isProfileComplete = profileResult.data === true;
  const billingResult = SC_CONFIG.BILLING_ACCESS.REQUIRED
    ? await supabase.schema(schemaName('api')).rpc('has_billing_access_by_current_user', {
        input_feature_lookup_key: SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY ?? undefined,
      })
    : { data: true, error: null };

  if (billingResult.error) throw billingResult.error;

  return {
    ...identity,
    hasBillingAccess: billingResult.data === true,
    isProfileComplete,
  };
}

export async function requireOnboardedUser(): Promise<OnboardedUserIdentity> {
  const identity = await requireVerifiedUser();
  if (identity.claims.is_anonymous !== true) await initialiseAccountUsername(await createClient());

  if (!SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED) {
    return { ...identity, isProfileComplete: true };
  }

  const supabase = await createClient();
  const profileResult = await supabase.schema(schemaName('api')).rpc('is_profile_complete_by_current_user', {
    input_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
  });

  if (profileResult.error) throw profileResult.error;

  const decision = decideAccess({
    billingRequired: false,
    boundary: 'onboarded',
    hasBillingAccess: true,
    isProfileComplete: profileResult.data === true,
    isVerified: true,
    onboardingRequired: true,
  });

  if (decision === 'onboarding') {
    redirect(SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH);
  }

  return { ...identity, isProfileComplete: true };
}

export async function requireAppAccess(): Promise<AppAccessState> {
  const identity = await requireOnboardedUser();
  const supabase = await createClient();
  const billingResult = SC_CONFIG.BILLING_ACCESS.REQUIRED
    ? await supabase.schema(schemaName('api')).rpc('has_billing_access_by_current_user', {
        input_feature_lookup_key: SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY ?? undefined,
      })
    : { data: true, error: null };

  if (billingResult.error) throw billingResult.error;

  const access = {
    ...identity,
    hasBillingAccess: billingResult.data === true,
  };

  const decision = decideAccess({
    billingRequired: SC_CONFIG.BILLING_ACCESS.REQUIRED,
    boundary: 'app',
    hasBillingAccess: access.hasBillingAccess,
    isProfileComplete: true,
    isVerified: true,
    onboardingRequired: false,
  });

  if (decision === 'billing') {
    redirect(SC_CONFIG.BILLING_ACCESS.REDIRECT_PATH);
  }

  return access;
}
