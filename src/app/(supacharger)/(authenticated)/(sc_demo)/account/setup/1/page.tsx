'use client';

import { useState } from 'react';
import Link from 'next/link';

import FullScreenDialog from '@/supacharger/components/ui/fullscreen-dialog';

export default function SetupStep1() {
const [open, setOpen] = useState(true);
  return (
    <>
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold tracking-tight'>Setup Wizard</h2>

        <FullScreenDialog
      open={open}
      onOpenChange={setOpen}
      dialogTitle="How did you hear about us?"
      dialogDescription="We'd love to know how you found us! This helps us improve our service and reach more awesome people like you."
      dialogContent={
        <form className="w-full max-w-md flex flex-col items-center">
          <label className="mb-2 font-semibold" htmlFor="source">
            Select an option:
          </label>
          <select
            id="source"
            name="source"
            className="mb-4 w-full rounded border px-3 py-2"
          >
            <option value="">-- Please choose --</option>
            <option value="friend">Friend or Family</option>
            <option value="social">Social Media</option>
            <option value="search">Search Engine</option>
            <option value="ad">Online Advertisement</option>
            <option value="event">Event or Conference</option>
            <option value="other">Other</option>
          </select>
          <button
            type="submit"
            className="mt-4 px-6 py-2 rounded bg-primary text-white font-bold"
          >
            Submit
          </button>

          <Link href="/account/setup/2" className='btn my-6'>Continue</Link>
        </form>
      }
    />

      </div>
    </>
  );
}
