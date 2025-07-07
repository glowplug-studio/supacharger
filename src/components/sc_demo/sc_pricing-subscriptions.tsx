import { Check } from 'lucide-react';

import { Input } from '../ui/input';

export default function SCPricingSubscription() {
  return (
    <>
      <div className='mt-10 grid gap-6 max-sm:mx-auto max-sm:max-w-sm sm:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-md bg-muted p-6 '>
          <h3 className='mb-2 text-xl font-semibold '>Starter</h3>
          <p className='text-sm text-slate-500'>For Individuals and Small Teams</p>

          <div className='mt-6'>
            <h3 className='text-2xl font-semibold '>
              $10 <sub className='text-sm font-medium text-slate-500'>per month</sub>
            </h3>
          </div>

          <button
              type='button'
              className='btn bg-primary mt-4 w-full'
            >
              Get Started
            </button>

          <div className='mt-6'>
            <h4 className='mb-2 text-lg font-semibold '>Includes</h4>
            <p className='text-sm text-slate-500'>Everything you get in this plan</p>

            <ul className='mt-6 space-y-4'>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                50 Etiam feugiat
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                10 Maecenas condimentum
              </li>
            </ul>

            <div className='mt-6'>
              <label className='flex cursor-pointer items-center gap-2'>
                <Input type='checkbox' id='upgrade-oneoffbundle' className='h-4 w-4 rounded-md' />
                <span className='text-sm font-medium'>Add Upgrade One-Off Bundle</span>
              </label>
            </div>

          </div>
        </div>

        <div className='rounded-md bg-muted p-6  '>
          <h3 className='mb-2 flex items-center text-xl font-semibold'>
            Professional{' '}
            <span className='ml-3 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-slate-800'>
              Best Deal
            </span>
          </h3>
          <p className='text-sm text-slate-500'>For Individuals and Largest Teams</p>

          <div className='mt-6'>
            <h3 className='text-2xl font-semibold '>
              $20 <sub className='text-sm font-medium text-slate-500'>per month</sub>
            </h3>
          </div>
          <button
              type='button'
              className='btn bg-primary mt-4 w-full'
            >
              Get Started
            </button>
          <div className='mt-6'>
            <h4 className='mb-2 text-lg font-semibold '>Includes</h4>
            <p className='text-sm text-slate-500'>Everything you get in this plan</p>
            <ul className='mt-6 space-y-4'>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                100 Etiam Feugiat
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                20 Maecenas condimentum
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                Etiam eget nisi ultrices
              </li>
            </ul>
          </div>
        </div>

        <div className='rounded-md bg-muted p-6  '>
          <h3 className='mb-2 text-xl font-semibold '>Business</h3>
          <p className='text-sm text-slate-500'>For Multiples and Largest Teams</p>

          <div className='mt-6'>
            <h3 className='text-2xl font-semibold '>
              $100 <sub className='text-sm font-medium text-slate-500'>per month</sub>
            </h3>
          </div>

          <button
              type='button'
              className='btn bg-primary mt-4 w-full'
            >
              Get Started
            </button>

          <div className='mt-6'>
            <h4 className='mb-2 text-lg font-semibold '>Includes</h4>
            <p className='text-sm text-slate-500'>Everything you get in this plan</p>
            <ul className='mt-6 space-y-4'>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                300 Etiam feugiat
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                100 Maecenas condimentum
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                100 Team Members
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                Etiam eget nisi ultrices
              </li>
              <li className='flex items-center text-sm font-medium text-slate-500'>
                <Check size={14} className='mr-2 text-primary'></Check>
                Unlimited Turpis Blandit
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
