import Link from 'next/link';
import { Check } from 'lucide-react';

const includedFeatures = [
  'Private forum access',
  'Member resources',
  'Entry to annual conference',
  'Official member t-shirt',
];

export default function SCPricingOneTime() {
  return (
    <div className='mx-auto mt-16 max-w-2xl rounded-md bg-muted sm:mt-20 lg:mx-0 lg:flex lg:max-w-none'>
      <div className='p-8 sm:p-10 lg:flex-auto'>
        <h3 className='text-3xl font-semibold tracking-tight'>Unlimited Lifetime Account</h3>
        <p className='mt-6 text-base/7 '>
        Phasellus ac nulla sem. Donec nec est arcu. Maecenas non accumsan dolor, ac mattis velit.
        </p>
        <div className='mt-10 flex items-center gap-x-4'>
          <h4 className='flex-none text-sm/6 font-semibold'>What’s included</h4>
          <div className='h-px flex-auto bg-gray-100' />
        </div>
        <ul role='list' className='mt-8 grid grid-cols-1 gap-4 text-sm/6  sm:grid-cols-2 sm:gap-6'>
          {includedFeatures.map((feature) => (
            <li key={feature} className='flex gap-x-3'>
              <Check aria-hidden='true' className='h-6 w-5 flex-none text-primary' />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className='-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:shrink-0'>
        <div className='rounded-md bg-gray-50 dark:bg-slate-600 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16'>
          <div className='mx-auto max-w-xs px-8'>
            <p className='text-base font-semibold text-foreground'>Unlimited access, forever</p>
            <p className='mt-6 flex items-baseline justify-center gap-x-2 mb-10'>
              <span className='text-5xl font-semibold tracking-tight'>$500</span>
              <span className='text-sm/6 font-semibold tracking-wide'>USD</span>
            </p>
            <Link
              href='#'
              className='btn bg-primary'
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
