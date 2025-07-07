'use client';

import { useState } from 'react';
import Link from 'next/link';

import FullScreenDialog from '@/supacharger/components/ui/fullscreen-dialog';

export default function SetupStep2() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Setup Wizard</h2>
          <FullScreenDialog
            open={open}
            onOpenChange={setOpen}
            dialogTitle='Complete Your Profile'
            dialogDescription='Finish setting up your profile to get the most out of your experience. This helps us personalize your journey!'
            dialogContent={
              <form className='flex w-full max-w-md flex-col items-center'>
                <label className='mb-2 font-semibold' htmlFor='fullname'>
                  Full Name
                </label>
                <input
                  id='fullname'
                  name='fullname'
                  type='text'
                  className='mb-4 w-full rounded border px-3 py-2'
                  placeholder='Enter your full name'
                />

                <label className='mb-2 font-semibold' htmlFor='email'>
                  Email Address
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  className='mb-4 w-full rounded border px-3 py-2'
                  placeholder='Enter your email'
                />

                <label className='mb-2 font-semibold' htmlFor='bio'>
                  Short Bio
                </label>
                <textarea
                  id='bio'
                  name='bio'
                  className='mb-4 w-full rounded border px-3 py-2'
                  placeholder='Tell us a little about yourself'
                  rows={3}
                />

                <button type='submit' className='mt-4 rounded bg-primary px-6 py-2 font-bold text-white'>
                  Save Profile
                </button>

                <Link href="/account/setup/1" className='btn my-6 bg-muted'>Back</Link>

                <Link href="/account" className='btn my-6 bg-primary'>Done</Link>
              </form>
            }
          />
        </div>
      </div>
    </>
  );
}
