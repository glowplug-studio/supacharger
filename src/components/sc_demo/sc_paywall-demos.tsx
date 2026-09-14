'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  CreditCard,
  ExternalLink,
  Info,
  LockKeyhole,
  PackagePlus,
  Plus,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { SCCopyCodeButton } from './sc_copy-code-button';

const demoIcons = [LockKeyhole, ExternalLink, Info, Sparkles, ShoppingBag, Smartphone, CreditCard];

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
});

type PaywallService = { description: string; id: string; name: string; price: number };

type ModalExampleContent = {
  agentNote: string;
  code: string;
  copied: string;
  copy: string;
  copyFailed: string;
  title: string;
};

function translatedText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function SCPaywallDemoGallery({ modalExampleFallback }: { modalExampleFallback: ModalExampleContent }) {
  const t = useTranslations('MarketingFeaturePages');
  const content = t.raw('paywallDemos') as any;
  const [cartOpen, setCartOpen] = useState(false);
  const [inAppPurchaseReady, setInAppPurchaseReady] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [stripeSubmitted, setStripeSubmitted] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const modalExample = {
    agentNote: translatedText(content.modalExample?.agentNote, modalExampleFallback.agentNote),
    code: translatedText(content.modalExample?.code, modalExampleFallback.code),
    copied: translatedText(content.modalExample?.copied, modalExampleFallback.copied),
    copy: translatedText(content.modalExample?.copy, modalExampleFallback.copy),
    copyFailed: translatedText(content.modalExample?.copyFailed, modalExampleFallback.copyFailed),
    title: translatedText(content.modalExample?.title, modalExampleFallback.title),
  };

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
      <section className='px-4 py-16 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <h2 className='max-w-2xl text-3xl leading-tight font-normal tracking-[-0.035em] text-balance sm:text-5xl'>
            {content.galleryTitle}
          </h2>
          <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-7'>{content.galleryDescription}</p>

          <div className='mt-12 grid gap-5 lg:grid-cols-12'>
            <article className='border-border bg-card rounded-lg border p-6 lg:col-span-5' data-paywall-demo='modal'>
              <DemoHeading icon={demoIcons[0]} item={content.items[0]} />
              <Dialog onOpenChange={setUpgradeModalOpen} open={upgradeModalOpen}>
                <Button className='mt-8 h-auto rounded-lg px-4 py-2.5' onClick={openUpgradeModal}>
                  {content.items[0].cta}
                </Button>
                <DialogContent className='border-border bg-background text-foreground rounded-lg'>
                  <DialogHeader>
                    <DialogTitle>{content.modal.title}</DialogTitle>
                    <DialogDescription className='text-muted-foreground leading-6'>
                      {content.modal.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className='border-border bg-muted/40 mt-2 rounded-lg border p-5'>
                    <p className='text-sm font-medium'>{content.modal.plan}</p>
                    <p className='mt-2 text-3xl tracking-[-0.03em]'>{content.modal.price}</p>
                    <p className='text-muted-foreground mt-2 text-sm'>{content.modal.priceCaption}</p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button className='rounded-lg' variant='outline'>
                        {content.modal.dismiss}
                      </Button>
                    </DialogClose>
                    <Button asChild className='rounded-lg'>
                      <Link href={content.billingCta.href}>{content.modal.continue}</Link>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className='border-border mt-6 border-t pt-6'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <p className='text-sm font-medium'>{modalExample.title}</p>
                  <SCCopyCodeButton
                    code={modalExample.code}
                    copiedLabel={modalExample.copied}
                    copyLabel={modalExample.copy}
                    errorLabel={modalExample.copyFailed}
                  />
                </div>
                <pre className='border-border bg-muted/45 mt-3 overflow-x-auto rounded-lg border p-4 text-xs leading-6'>
                  <code>{modalExample.code}</code>
                </pre>
                <p className='text-muted-foreground mt-3 text-xs leading-5'>{modalExample.agentNote}</p>
              </div>
            </article>

            <article
              className='border-border bg-muted/35 rounded-lg border p-6 lg:col-span-7'
              data-paywall-demo='redirect'
            >
              <DemoHeading icon={demoIcons[1]} item={content.items[1]} />
              <div className='border-border mt-8 grid gap-4 border-t pt-6 sm:grid-cols-[1fr_auto] sm:items-end'>
                <div>
                  <p className='text-sm font-medium'>{content.products.plan}</p>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>{content.products.caption}</p>
                </div>
                <Button asChild className='h-auto rounded-lg px-4 py-2.5' variant='outline'>
                  <Link href='/pricing'>
                    {content.items[1].cta}
                    <ArrowRight aria-hidden='true' />
                  </Link>
                </Button>
              </div>
            </article>

            <article className='border-border bg-card rounded-lg border p-6 lg:col-span-4' data-paywall-demo='tooltip'>
              <DemoHeading icon={demoIcons[2]} item={content.items[2]} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='mt-8 block cursor-help' tabIndex={0}>
                      <Button className='w-full rounded-lg' disabled>
                        {content.tooltip.feature}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-64 rounded-lg px-3 py-2 leading-5'>
                    {content.tooltip.explanation}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </article>

            <article className='border-border bg-card rounded-lg border p-6 lg:col-span-8' data-paywall-demo='services'>
              <DemoHeading icon={demoIcons[3]} item={content.items[3]} />
              <div className='mt-8 grid gap-6 md:grid-cols-[1fr_15rem]'>
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
              className='border-border bg-muted/35 overflow-hidden rounded-lg border lg:col-span-7'
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

            <article className='border-border bg-card rounded-lg border p-6 lg:col-span-5' data-paywall-demo='in-app'>
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

            <article
              className='border-border bg-card rounded-lg border p-6 lg:col-span-12'
              data-paywall-demo='stripe-embedded-checkout'
              id='stripeEmbeddedCheckout'
            >
              <div className='grid gap-8 lg:grid-cols-[0.8fr_1.2fr]'>
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
          </div>
        </div>
      </section>

      <section className='border-border bg-muted/35 border-y px-4 py-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <BadgeDollarSign aria-hidden='true' className='text-primary size-6' />
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
