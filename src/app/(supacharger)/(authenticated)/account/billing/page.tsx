import { PropsWithChildren, ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/seperator';
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { Price, ProductWithPrices } from '@/features/pricing/types';

export default async function BillingPage() {
  const [session, subscription, products] = await Promise.all([getSession(), getSubscription(), getProducts()]);

  let userProduct: ProductWithPrices | undefined;
  let userPrice: Price | undefined;

  if (subscription) {
    for (const product of products) {
      for (const price of product.prices) {
        if (price.id === subscription.price_id) {
          userProduct = product;
          userPrice = price;
        }
      }
    }
  }

  const navigation = [
    { name: 'Account Settings', href: '/account', current: false },
    { name: 'Edit Profile', href: '/account/profile', current: false },
    { name: 'Billing', href: '/account/billing', current: true },
  ];

  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <section className=''>
      <div className='container'>
        <section className='w-full'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Billing</h2>
            <Separator className='my-4' />
          </div>

          <div className='container mx-auto flex flex-col gap-6 px-4 py-8 md:flex-row'>
            {/* Left column */}
            <div className='flex-1'>
              <h2 className='mb-4 text-2xl font-semibold'>Subscriptions</h2>
              <Link href='billing/portal'>Manage your subscription</Link>{' '}
              <Card
                title='Your Plan'
                footer={
                  subscription ? (
                    <Button size='sm' variant='secondary' asChild>
                      {/** Must stay as an anchor to resolvve CORS issues with stripe */}
                      <a href='billing/portal'>Manage your subscription</a>
                      {/** / Anchor */}
                    </Button>
                  ) : (
                    <Button size='sm' variant='secondary' asChild>
                      <Link href='/account/billing/subscribe'>Start a subscription</Link>
                    </Button>
                  )
                }
              >
                {userProduct && userPrice ? (
                  <PricingCard product={userProduct} price={userPrice} />
                ) : (
                  <p>You don&apos;t have an active subscription</p>
                )}
              </Card>
            </div>
            {/* Right column */}
            <div className='flex-1'>
              <h2 className='mb-4 text-2xl font-semibold'>PTEst</h2>
              {/* Additional right column content can go here */}
            </div>
          </div>

          {/* Billing History Section */}
          <div className='container mx-auto px-4 py-8'>
            <h2 className='mb-4 text-2xl font-semibold'>Billing History</h2>
            {/* Billing history content goes here */}
          </div>
        </section>
      </div>
    </section>
  );
}

function Card({
  title,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  footer?: ReactNode;
}>) {
  return (
    <div className='w-full max-w-3xl rounded-md bg-zinc-900'>
      <div className='p-4'>
        <h2 className='mb-1 text-xl font-semibold'>{title}</h2>
        <div className='py-4'>{children}</div>
      </div>
      <div className='flex justify-end rounded-b-md border-t border-zinc-800 p-4'>{footer}</div>
    </div>
  );
}
