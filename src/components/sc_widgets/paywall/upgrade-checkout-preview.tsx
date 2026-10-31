'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronRight, CreditCard, LockKeyhole } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

const plans = [
  { id: 'team', price: 19 },
  { id: 'scale', price: 60 },
] as const;
type Plan = (typeof plans)[number];

/** A local checkout demonstration. It never accepts payment details or creates a payment. */
export function UpgradeCheckoutPreview() {
  const t = useTranslations('MarketingFeaturePages.paywallDemos.checkoutPreview');
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState<'plans' | 'methods' | 'card'>('plans');
  const reducedMotion = useReducedMotion();
  const groupId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step !== 'plans') headingRef.current?.focus();
  }, [step]);

  const blueButton =
    'flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0074d4] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0064b7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0074d4] disabled:cursor-not-allowed disabled:opacity-40';
  const inputStyle =
    'h-11 w-full min-w-0 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 placeholder:text-slate-500 disabled:opacity-100';

  return (
    <div className='relative overflow-hidden' data-checkout-preview-step={step}>
      <AnimatePresence initial={false} mode='popLayout'>
        <motion.div
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            'w-full p-6 sm:p-8',
            step === 'plans' ? 'bg-background text-foreground' : 'bg-white text-slate-900',
          )}
          exit={{ x: reducedMotion ? 0 : '-100%', opacity: 0 }}
          initial={{ x: reducedMotion ? 0 : '100%', opacity: 0 }}
          key={step}
          transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <DialogTitle
            className='pr-6 text-xl leading-7 font-semibold tracking-tight outline-none'
            ref={headingRef}
            tabIndex={-1}
          >
            {t(step === 'plans' ? 'title' : step === 'methods' ? 'paymentTitle' : 'cardTitle')}
          </DialogTitle>
          <DialogDescription
            className={cn('mt-2 text-sm leading-6', step === 'plans' ? 'text-muted-foreground' : 'text-slate-500')}
          >
            {t(step === 'plans' ? 'description' : 'paymentDescription')}
          </DialogDescription>

          {step === 'plans' ? (
            <>
              <fieldset className='mt-6'>
                <legend className='sr-only'>{t('choosePlan')}</legend>
                <div className='grid grid-cols-2 gap-3'>
                  {plans.map((plan) => (
                    <label className='relative min-w-0 cursor-pointer' key={plan.id}>
                      <input
                        checked={selected?.id === plan.id}
                        className='peer sr-only'
                        name={groupId}
                        onChange={() => setSelected(plan)}
                        type='radio'
                        value={plan.id}
                      />
                      <span className='border-border bg-card peer-focus-visible:ring-ring block h-full rounded-lg border p-4 pt-11 transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-500/5 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2'>
                        <span className='block text-base font-semibold'>{t(plan.id)}</span>
                        <span className='mt-4 block text-3xl font-semibold tracking-tight'>${plan.price}</span>
                        <span className='text-muted-foreground mt-1 block text-xs leading-5'>{t('monthly')}</span>
                        <span className='text-muted-foreground mt-4 block text-sm leading-6'>
                          {t(`${plan.id}Description`)}
                        </span>
                      </span>
                      <span
                        aria-hidden='true'
                        className={cn(
                          'absolute top-4 right-4 flex size-5 items-center justify-center rounded-full border',
                          selected?.id === plan.id
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-border bg-background',
                        )}
                      >
                        {selected?.id === plan.id ? <Check className='size-3.5' strokeWidth={3} /> : null}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button
                className='mt-6 min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90'
                disabled={!selected}
                onClick={() => setStep('methods')}
                type='button'
              >
                {t('continueSignup')}
                <ChevronRight aria-hidden='true' className='size-4' />
              </Button>
            </>
          ) : (
            <>
              <div className='mt-5 flex items-center justify-between border-b border-slate-200 pb-5 text-sm'>
                <span className='font-medium'>{selected ? t(selected.id) : ''}</span>
                <span>{t('total', { price: selected?.price ?? 0 })}</span>
              </div>
              {step === 'methods' ? (
                <div className='mt-5 space-y-3'>
                  <button
                    className='h-11 w-full cursor-default rounded-md bg-black text-base font-semibold text-white'
                    disabled
                    type='button'
                  >
                    {t('applePay')}
                  </button>
                  <button
                    className='h-11 w-full cursor-default rounded-md bg-[#00d66f] text-base font-semibold text-[#003c21]'
                    disabled
                    type='button'
                  >
                    {t('payWithLink')}
                  </button>
                  <div className='flex items-center gap-3 py-1 text-xs text-slate-500'>
                    <span className='h-px flex-1 bg-slate-200' />
                    {t('or')}
                    <span className='h-px flex-1 bg-slate-200' />
                  </div>
                  <div className='overflow-hidden rounded-md border border-slate-300'>
                    {(['card', 'klarna', 'afterpay', 'affirm'] as const).map((method) => (
                      <button
                        className='flex h-11 w-full cursor-default items-center justify-between border-b border-slate-200 px-3 text-left text-sm last:border-0'
                        disabled
                        key={method}
                        type='button'
                      >
                        <span className='flex items-center gap-2'>
                          {method === 'card' ? <CreditCard aria-hidden='true' className='size-4' /> : null}
                          {t(method)}
                        </span>
                        <span
                          aria-hidden='true'
                          className={cn(
                            'text-xs font-bold',
                            method === 'klarna' && 'rounded bg-pink-200 px-1.5 py-0.5',
                            method === 'afterpay' && 'rounded bg-emerald-100 px-1.5 py-0.5',
                          )}
                        >
                          {method === 'card' ? 'VISA' : t(method)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className={cn(blueButton, 'mt-5')} onClick={() => setStep('card')} type='button'>
                    {t('continueCard')}
                  </button>
                </div>
              ) : (
                <div className='mt-5 space-y-4'>
                  <label className='grid gap-2 text-sm font-medium'>
                    {t('cardNumber')}
                    <input
                      autoComplete='off'
                      className={inputStyle}
                      disabled
                      placeholder='4242 4242 4242 4242'
                      type='text'
                    />
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <label className='grid gap-2 text-sm font-medium'>
                      {t('expiry')}
                      <input autoComplete='off' className={inputStyle} disabled placeholder='MM / YY' type='text' />
                    </label>
                    <label className='grid gap-2 text-sm font-medium'>
                      {t('securityCode')}
                      <input autoComplete='off' className={inputStyle} disabled placeholder='123' type='text' />
                    </label>
                  </div>
                  <p className='text-sm font-medium'>{t('billingAddress')}</p>
                  <label className='grid gap-2 text-sm font-medium'>
                    {t('country')}
                    <select className={inputStyle} disabled defaultValue='US'>
                      <option value='US'>{t('unitedStates')}</option>
                    </select>
                  </label>
                  <label className='grid gap-2 text-sm font-medium'>
                    {t('zip')}
                    <input autoComplete='off' className={inputStyle} disabled placeholder='12345' type='text' />
                  </label>
                  <label className='flex items-center gap-2 text-sm text-slate-600'>
                    <input checked className='size-4 accent-[#0074d4]' disabled readOnly type='checkbox' />
                    {t('saveCard')}
                  </label>
                  <button className={blueButton} type='button'>
                    <LockKeyhole aria-hidden='true' className='size-4' />
                    {t('pay', { price: selected?.price ?? 0 })}
                  </button>
                </div>
              )}
            </>
          )}
          <p
            className={cn(
              'mt-4 text-center text-xs leading-5',
              step === 'plans' ? 'text-muted-foreground' : 'text-slate-500',
            )}
          >
            {t('demoNotice')}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
