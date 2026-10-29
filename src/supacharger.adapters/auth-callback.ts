import type { AuthCallbackContext, AuthCallbackFailureContext } from '@/supacharger/auth/callback-adapter-contract';
import { getAuthLoginRedirect } from '@/supacharger/auth/login-redirect';
import { withNextPath } from '@/supacharger/auth/safe-next-path';
import { schemaName } from '@/supacharger/namespace';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { appURL } from '@/supacharger/utils/app-origin';

import 'server-only';

export async function resolveAuthCallbackFailure(context: AuthCallbackFailureContext): Promise<string | URL> {
  return appURL('/auth/error', context.requestUrl.origin);
}

export async function resolveAuthCallbackSuccess({
  nextPath,
  requestUrl,
  supabase,
}: AuthCallbackContext): Promise<string | URL> {
  let destination: string | null = null;

  if (SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED) {
    const { data: profileComplete, error: profileError } = await supabase
      .schema(schemaName('api'))
      .rpc('is_profile_complete_by_current_user', {
        input_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
      });

    if (profileError) throw profileError;

    if (profileComplete !== true) {
      destination = withNextPath(SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH, nextPath);
    }
  }

  if (!destination && SC_CONFIG.BILLING_ACCESS.REQUIRED) {
    const { data: hasAccess, error: billingError } = await supabase
      .schema(schemaName('api'))
      .rpc('has_billing_access_by_current_user', {
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
      const loginRedirect = getAuthLoginRedirect(
        SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION,
        requestUrl.origin,
      );
      destination = `${loginRedirect.pathname}${loginRedirect.search}`;
    }
  }

  if (SC_CONFIG.SUPABASE_AUTH.METHODS.MFA_TOTP.REQUIRED_FOR_SIGN_IN) {
    const { data: assurance, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
      return appURL(withNextPath('/account/mfa', destination), requestUrl.origin);
    }
  }

  return appURL(destination, requestUrl.origin);
}
