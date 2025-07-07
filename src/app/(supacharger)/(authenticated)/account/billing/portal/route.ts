import { redirect } from 'next/navigation';

import { getCustomerId } from '@/features/account/controllers/get-customer-id';
import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { getUser } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getURL } from '@/supacharger/utils/helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Use try/catch for your logic, but NOT for redirect()
  let url: string | null = null;

  try {
    // 1. Get the user from session
    const supaUser = await getUser();

    if (!('user' in supaUser) || !supaUser.user.id) {
      throw new Error('User not found or missing user ID.');
    }

    // 2. Retrieve or create the customer in Stripe
    const customer = await getCustomerId({
      userId: supaUser.user.id,
    });

    if (!customer) {
      throw new Error('Could not get Stripe customer.');
    }

    // 3. Create portal link
    const session = await stripeAdmin.billingPortal.sessions.create({
      customer,
      return_url: getURL() + "/" + SC_CONFIG.STRIPE_PORTAL_LOGO_RETURN_PATH,
    });

    url = session.url;
  } catch (error: any) {
    // Log the error and show it in the browser
    console.error('Stripe Billing Error:', error);
    return new Response(
      `<h1>Stripe Billing Error</h1><pre>${error?.message || error}</pre>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // Only call redirect() outside the try/catch
  return redirect(url!);
}
