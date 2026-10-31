import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ApplicationErrorCopy } from './application-error-copy';

const SUPPORT_HREF = 'mailto:support@glowplug.studio';

export function ApplicationErrorContent({ copy, homeHref, reloadHint }: {
  copy: ApplicationErrorCopy;
  homeHref: string;
  reloadHint?: string;
}) {
  return (
    <section className='flex flex-1 items-center justify-center px-6 py-16 sm:px-8'>
      <div className='flex w-full max-w-3xl flex-col items-center text-center'>
        <p className='text-primary text-sm font-semibold tracking-[0.18em] uppercase'>{copy.status}</p>
        <h1 className='text-foreground mt-4 text-4xl font-semibold tracking-tight sm:text-6xl'>{copy.title}</h1>
        <p className='text-muted-foreground mt-5 max-w-xl text-base leading-7 sm:text-lg'>{copy.description}</p>
        {reloadHint ? <p className='text-muted-foreground mt-8 text-sm'>{reloadHint}</p> : <div className='mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center'>
          <Button
            asChild
            size='lg'
            className='bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 rounded-none shadow-none'
          >
            <Link href={homeHref}>{copy.goHome}</Link>
          </Button>
          <Button
            asChild
            size='lg'
            variant='ghost'
            className='text-foreground hover:bg-accent hover:text-accent-foreground rounded-none shadow-none'
          >
            <a href={SUPPORT_HREF}>
              {copy.contactSupport}
              <ArrowRight aria-hidden='true' />
            </a>
          </Button>
        </div>}
      </div>
    </section>
  );
}
