// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/auth/callback/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { SC_CONFIG } from "@/supacharger/supacharger-config";
import { getURL } from '@/supacharger/utils/helpers';

let siteUrl = getURL();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect( getURL(SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION) );
    }

    if (SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED) {
      const { data: profileComplete } = await supabase
        .schema('api')
        .rpc('is_profile_complete_by_current_user', {
          p_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
        });

      if (profileComplete === false) {
        return NextResponse.redirect(siteUrl + SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH);
      }
    }




    if (SC_CONFIG.BILLING_ACCESS.REQUIRED) {
      const { data: hasBillingAccess } = await supabase.schema('api').rpc('has_billing_access_by_current_user', {
        p_feature_lookup_key: SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY,
      });
      if (!hasBillingAccess) {
        return NextResponse.redirect(siteUrl + SC_CONFIG.BILLING_ACCESS.REDIRECT_PATH);
      }
    }
    return NextResponse.redirect(siteUrl);
  }

  return NextResponse.redirect(siteUrl);
}
