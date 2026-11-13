'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Check,
  CreditCard,
  CreditCardReader,
  ExternalLink,
  HandCoins,
  Info,
  LockKeyhole,
  PackagePlus,
  Plus,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from 'lucide-react';

import { UpgradeCheckoutPreview } from '@/components/sc_widgets/paywall/upgrade-checkout-preview';
import { Button } from '@/supacharger/components/ui/button';
import { Dialog, DialogContent } from '@/supacharger/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/supacharger/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/supacharger/components/ui/tooltip';

import englishMessages from '../../../messages/en.json';

const demoIcons = [LockKeyhole, ExternalLink, Info, Sparkles, ShoppingBag, Smartphone, CreditCard];

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
});

type PaywallService = { description: string; id: string; name: string; price: number };

type TrialPlan = {
  description: string;
  name: string;
  price: number;
  trialLength: string;
};

function translatedText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function SCPaywallDemoGallery() {
  const t = useTranslations('MarketingFeaturePages');
  const content = t.raw('paywallDemos') as any;
  const [cartOpen, setCartOpen] = useState(false);
  const [inAppPurchaseReady, setInAppPurchaseReady] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [stripeSubmitted, setStripeSubmitted] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const trialPlans = englishMessages.MarketingFeaturePages.paywallDemos.products.trialPlans.map(
    (plan: TrialPlan, index) => ({
      description: translatedText(content.products.trialPlans?.[index]?.description, plan.description),
      name: translatedText(content.products.trialPlans?.[index]?.name, plan.name),
      price: plan.price,
      trialLength: translatedText(content.products.trialPlans?.[index]?.trialLength, plan.trialLength),
    }),
  );

  const selectedServiceDetails = content.services.options.filter((service: PaywallService) =>
    selectedServices.includes(service.id),
  );
  const monthlyTotal =
    content.services.basePrice +
    selectedServiceDetails.reduce((total: number, service: PaywallService) => total + service.price, 0);
  const activePlan = selectedServices.length > 1 ? content.services.expandedPlan : content.services.basePlan;

  const toggleService = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  };

  const openUpgradeModal = () => setUpgradeModalOpen(true);

  const submitStripePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStripeSubmitted(true);
  };

  return (
    <>
      <section className='py-16'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
          <h2 className='max-w-2xl text-3xl leading-tight font-normal tracking-[-0.035em] text-balance sm:text-5xl'>
            {content.galleryTitle}
          </h2>
          <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-7'>{content.galleryDescription}</p>

          <div className='mt-12 grid items-stretch gap-5 lg:grid-cols-2'>
            <article
              className='border-border bg-card flex h-full flex-col rounded-lg border p-6'
              data-paywall-demo='modal'
            >
              <DemoHeading icon={demoIcons[0]} item={content.items[0]} />
              <Dialog onOpenChange={setUpgradeModalOpen} open={upgradeModalOpen}>
                <Button className='mt-8 h-auto self-start rounded-lg px-4 py-2.5' onClick={openUpgradeModal}>
                  {content.items[0].cta}
                </Button>
                <DialogContent className='border-border bg-background text-foreground max-h-[90dvh] overflow-x-hidden overflow-y-auto rounded-lg p-0 sm:max-w-xl [&>button]:text-slate-500'>
                  <UpgradeCheckoutPreview onComplete={() => setUpgradeModalOpen(false)} />
                </DialogContent>
              </Dialog>
            </article>

            <article className='border-border h-full rounded-lg border p-6' data-paywall-demo='redirect'>
              <div>
                <ExternalLink aria-hidden='true' className='text-primary size-5' />
                <h3 className='mt-5 text-xl font-medium tracking-[-0.02em]'>{content.items[1].title}</h3>
              </div>
              <div className='border-border bg-muted/35 mt-8 overflow-x-auto rounded-lg border' role='table'>
                <div
                  className='bg-muted/45 grid min-w-[32rem] grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem]'
                  role='row'
                >
                  {englishMessages.MarketingFeaturePages.paywallDemos.products.redirectTable.headers.map(
                    (fallback, index) => (
                      <div
                        className='text-muted-foreground border-border px-4 py-3 text-xs font-medium not-last:border-r'
                        key={fallback}
                        role='columnheader'
                      >
                        {translatedText(content.products.redirectTable?.headers?.[index], fallback)}
                      </div>
                    ),
                  )}
                </div>
                <div
                  className='grid min-w-[32rem] grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem] items-center'
                  role='row'
                >
                  {englishMessages.MarketingFeaturePages.paywallDemos.products.redirectTable.row.map(
                    (fallback, index) => (
                      <div className='border-border px-4 py-4 text-sm not-last:border-r' key={fallback} role='cell'>
                        {translatedText(content.products.redirectTable?.row?.[index], fallback)}
                      </div>
                    ),
                  )}
                  <div className='px-4 py-3' role='cell'>
                    <Button asChild className='h-auto w-full rounded-lg px-4 py-2.5' variant='outline'>
                      <Link href='/#pricing'>{content.items[1].cta}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>

            <article
              className='border-border bg-card h-full rounded-lg border p-6'
              data-paywall-demo='stripe-embedded-checkout'
              id='stripeEmbeddedCheckout'
            >
              <div className='grid gap-8'>
                <DemoHeading icon={demoIcons[6]} item={content.items[6]} />
                <form className='bg-muted/35 rounded-lg p-5' onSubmit={submitStripePreview}>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <label className='grid gap-2 text-sm font-medium'>
                      {content.stripe.emailLabel}
                      <input
                        className='border-input bg-background focus-visible:ring-ring h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2'
                        defaultValue='demo@example.com'
                        type='email'
                      />
                    </label>
                    <label className='grid gap-2 text-sm font-medium'>
                      {content.stripe.cardLabel}
                      <input
                        className='border-input bg-background focus-visible:ring-ring h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2'
                        inputMode='numeric'
                        placeholder={content.stripe.cardPlaceholder}
                      />
                    </label>
                  </div>
                  <Button className='mt-5 h-auto rounded-lg px-4 py-2.5' type='submit'>
                    {content.items[6].cta}
                  </Button>
                  <p className='text-muted-foreground mt-3 text-xs leading-5'>{content.stripe.disclaimer}</p>
                  {stripeSubmitted ? (
                    <p className='text-primary mt-3 text-sm' role='status'>
                      {content.stripe.status}
                    </p>
                  ) : null}
                </form>
              </div>
            </article>

            <article className='border-border bg-card h-full rounded-lg border p-6' data-paywall-demo='trial'>
              <CreditCardReader aria-hidden='true' className='text-primary size-5' />
              <h3 className='mt-5 text-xl font-medium tracking-[-0.02em]'>
                {translatedText(
                  content.products.trialTitle,
                  englishMessages.MarketingFeaturePages.paywallDemos.products.trialTitle,
                )}
              </h3>
              <p className='text-muted-foreground mt-3 max-w-xl text-sm leading-6'>
                {translatedText(
                  content.products.trialCaption,
                  englishMessages.MarketingFeaturePages.paywallDemos.products.trialCaption,
                )}
              </p>
              <div className='mt-8 grid gap-3 sm:grid-cols-3'>
                {trialPlans.map((plan) => (
                  <div className='border-border bg-background flex flex-col rounded-lg border p-4' key={plan.name}>
                    <p className='text-sm font-medium'>{plan.name}</p>
                    <p className='mt-3 text-2xl tracking-[-0.03em]'>{currency.format(plan.price)}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {translatedText(
                        content.products.monthlyAfterTrial,
                        englishMessages.MarketingFeaturePages.paywallDemos.products.monthlyAfterTrial,
                      )}
                    </p>
                    <p className='text-primary mt-4 text-xs font-medium'>{plan.trialLength}</p>
                    <p className='text-muted-foreground mt-2 flex-1 text-xs leading-5'>{plan.description}</p>
                    <Button asChild className='mt-5 h-auto w-full rounded-lg px-4 py-2.5'>
                      <a href='https://checkout.stripe.dev/checkout' rel='noopener noreferrer' target='_blank'>
                        {translatedText(
                          content.products.trialCta,
                          englishMessages.MarketingFeaturePages.paywallDemos.products.trialCta,
                        )}
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </article>

            <article className='border-border bg-card h-full rounded-lg border p-6' data-paywall-demo='tooltip'>
              <DemoHeading icon={demoIcons[2]} item={content.items[2]} />
              <TooltipProvider delay={0}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className='mt-8 block cursor-help' tabIndex={0}>
                        <Button className='w-full rounded-lg' disabled>
                          {content.tooltip.feature}
                        </Button>
                      </span>
                    }
                  />
                  <TooltipContent className='max-w-64 rounded-lg px-3 py-2 leading-5'>
                    {content.tooltip.explanation}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </article>

            <article className='border-border bg-card h-full rounded-lg border p-6' data-paywall-demo='services'>
              <DemoHeading icon={demoIcons[3]} item={content.items[3]} />
              <div className='mt-8 grid gap-6 xl:grid-cols-[1fr_15rem]'>
                <div className='grid gap-3'>
                  {content.services.options.map((service: PaywallService) => {
                    const selected = selectedServices.includes(service.id);

                    return (
                      <button
                        aria-pressed={selected}
                        className='border-border hover:bg-accent flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors active:scale-[0.99]'
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        type='button'
                      >
                        <span>
                          <span className='block text-sm font-medium'>{service.name}</span>
                          <span className='text-muted-foreground mt-1 block text-xs'>{service.description}</span>
                        </span>
                        <span className='flex shrink-0 items-center gap-2 text-sm'>
                          {currency.format(service.price)}
                          {selected ? (
                            <Check aria-hidden='true' className='text-primary size-4' />
                          ) : (
                            <Plus aria-hidden='true' className='size-4' />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className='bg-muted/45 rounded-lg p-5'>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>{content.services.planLabel}</p>
                  <p className='mt-2 text-lg font-medium'>{activePlan}</p>
                  <p className='mt-5 text-3xl tracking-[-0.03em]'>{currency.format(monthlyTotal)}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>{content.services.monthly}</p>
                </div>
              </div>
            </article>

            <article
              className='border-border bg-muted/35 h-full overflow-hidden rounded-lg border'
              data-paywall-demo='cart'
            >
              <div className='grid h-full sm:grid-cols-[0.8fr_1.2fr]'>
                <Image
                  alt={content.cart.imageAlt}
                  className='h-full min-h-64 w-full object-cover object-left-top'
                  height={571}
                  sizes='(max-width: 640px) 100vw, 35vw'
                  src='/images/sc_demo/sc-marketing-mobile-onboarding.webp'
                  width={960}
                />
                <div className='p-6'>
                  <DemoHeading icon={demoIcons[4]} item={content.items[4]} />
                  <p className='mt-6 text-2xl tracking-[-0.03em]'>{content.cart.price}</p>
                  <Button className='mt-6 h-auto rounded-lg px-4 py-2.5' onClick={() => setCartOpen(true)}>
                    {content.items[4].cta}
                  </Button>
                </div>
              </div>
            </article>

            <article className='border-border bg-card h-full rounded-lg border p-6' data-paywall-demo='in-app'>
              <DemoHeading icon={demoIcons[5]} item={content.items[5]} />
              <div className='border-border mt-8 rounded-lg border p-4'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium'>{content.inApp.product}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>{content.inApp.price}</p>
                  </div>
                  <Button
                    className='rounded-lg'
                    onClick={() => setInAppPurchaseReady(true)}
                    variant={inAppPurchaseReady ? 'outline' : 'default'}
                  >
                    {inAppPurchaseReady ? content.inApp.ready : content.items[5].cta}
                  </Button>
                </div>
                {inAppPurchaseReady ? (
                  <p className='text-primary mt-4 text-sm' role='status'>
                    {content.inApp.status}
                  </p>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className='border-border bg-muted/35 border-y py-20'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
          <HandCoins aria-hidden='true' className='text-primary size-6' />
          <h2 className='mt-6 max-w-2xl text-3xl leading-tight font-normal tracking-[-0.035em] text-balance sm:text-5xl'>
            {content.billingCta.title}
          </h2>
          <p className='text-muted-foreground mt-5 max-w-xl text-base leading-7'>{content.billingCta.description}</p>
          <Button asChild className='mt-8 h-auto rounded-lg px-5 py-3'>
            <Link href={content.billingCta.href}>
              {content.billingCta.label}
              <ArrowRight aria-hidden='true' />
            </Link>
          </Button>
        </div>
      </section>

      <Sheet onOpenChange={setCartOpen} open={cartOpen}>
        <SheetContent className='border-border bg-background text-foreground flex flex-col' side='right'>
          <SheetHeader>
            <SheetTitle className='text-foreground'>{content.cart.title}</SheetTitle>
            <SheetDescription className='text-muted-foreground'>{content.cart.description}</SheetDescription>
          </SheetHeader>
          <div className='border-border flex items-center gap-4 rounded-lg border p-4'>
            <PackagePlus aria-hidden='true' className='text-primary size-5' />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium'>{content.cart.product}</p>
              <p className='text-muted-foreground mt-1 text-xs'>{content.cart.license}</p>
            </div>
            <p className='text-sm font-medium'>{content.cart.price}</p>
          </div>
          <SheetFooter className='mt-auto'>
            <Button asChild className='w-full rounded-lg'>
              <Link href={content.billingCta.href}>{content.cart.checkout}</Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface DemoHeadingProps {
  icon: typeof LockKeyhole;
  item: { description: string; title: string };
}

function DemoHeading({ icon: Icon, item }: DemoHeadingProps) {
  return (
    <div>
      <Icon aria-hidden='true' className='text-primary size-5' />
      <h3 className='mt-5 text-xl font-medium tracking-[-0.02em]'>{item.title}</h3>
      <p className='text-muted-foreground mt-3 max-w-xl text-sm leading-6'>{item.description}</p>
    </div>
  );
}
