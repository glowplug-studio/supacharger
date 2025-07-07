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

    // if theres a wizard - 
    // @todo - check if the user has done this with claims
    if(SC_CONFIG.ACCOUNT_CREATION_STEPS_URL !== null){
      return NextResponse.redirect(siteUrl+SC_CONFIG.ACCOUNT_CREATION_STEPS_URL);
    }




    // Check if user is subscribed, if not redirect to pricing page
    const { data: userSubscription } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .maybeSingle();

      //@ TODO Config settings and how to handle what happens to accounts after link confirm? - do they need to add more info? a password? do they need to get a subscription?

    if (!userSubscription) {
      return NextResponse.redirect(`${siteUrl}/pricing`);
    } else {
      return NextResponse.redirect(`${siteUrl}`);
    }
  }

  return NextResponse.redirect(siteUrl);
}