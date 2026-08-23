import type {
  AuthCallbackContext,
  AuthCallbackFailureContext,
} from '@/supacharger/auth/callback-adapter-contract';
import { getAuthLoginRedirect } from '@/supacharger/auth/login-redirect';
import { withNextPath } from '@/supacharger/auth/safe-next-path';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getURL } from '@/supacharger/utils/helpers';

import 'server-only';

export async function resolveAuthCallbackFailure(context: AuthCallbackFailureContext): Promise<string | URL> {
  void context;
  return getURL('/auth/error');
}

export async function resolveAuthCallbackSuccess({
  nextPath,
  supabase,
}: AuthCallbackContext): Promise<string | URL> {
  let destination: string | null = null;

  if (SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED) {
    const { data: profileComplete, error: profileError } = await supabase.schema('api').rpc('is_profile_complete_by_current_user', {
      input_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
    });

    if (profileError) throw profileError;

    if (profileComplete !== true) {
      destination = withNextPath(SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH, nextPath);
    }
  }

  if (!destination && SC_CONFIG.BILLING_ACCESS.REQUIRED) {
    const { data: hasAccess, error: billingError } = await supabase.schema('api').rpc('has_billing_access_by_current_user', {
      input_feature_lookup_key: SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY ?? undefined,
    });

    if (billingError) throw billingError;

    if (hasAccess !== true) {
      destination = withNextPath(SC_CONFIG.BILLING_ACCESS.REDIRECT_PATH, nextPath);
    }
  }

  if (!destination) {
    if (nextPath) destination = nextPath;
    else {
      const loginRedirect = getAuthLoginRedirect(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION);
      destination = `${loginRedirect.pathname}${loginRedirect.search}`;
    }
  }

  if (SC_CONFIG.AUTHENTICATION.MFA_TOTP.ENABLED && SC_CONFIG.AUTHENTICATION.MFA_TOTP.REQUIRED_FOR_SIGN_IN) {
    const { data: assurance, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
      return getURL(withNextPath('/account/mfa', destination));
    }
  }

  return getURL(destination);
}
