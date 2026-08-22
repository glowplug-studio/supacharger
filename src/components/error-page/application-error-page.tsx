import Link from 'next/link';
import { getMessages } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';

import SCFooterSession from '@/components/sc_demo/sc_footer-session';
import { SCHeaderSession } from '@/components/sc_demo/sc_header-session';
import { Button } from '@/components/ui/button';
import { isLoggedIn } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import {
  type ApplicationErrorKind,
  resolveApplicationErrorCopy,
} from './application-error-copy';

type ApplicationErrorPageProps = {
  kind: ApplicationErrorKind;
};

const SUPPORT_HREF = 'mailto:support@glowplug.studio';

export async function ApplicationErrorPage({ kind }: ApplicationErrorPageProps) {
  const [authenticated, messages] = await Promise.all([isLoggedIn(), getMessages()]);
  const copy = resolveApplicationErrorCopy(messages, kind);
  const homeHref = authenticated
    ? SC_CONFIG.USER_REDIRECTS.AUTHED_USER.HOME_PATH
    : SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.HOME_PATH;

  const errorContent = (
    <section className='flex flex-1 items-center justify-center px-6 py-16 sm:px-8'>
      <div className='flex w-full max-w-3xl flex-col items-center text-center'>
        <p className='text-primary text-sm font-semibold tracking-[0.18em] uppercase'>{copy.status}</p>
        <h1 className='text-foreground mt-4 text-4xl font-semibold tracking-tight sm:text-6xl'>{copy.title}</h1>
        <p className='text-muted-foreground mt-5 max-w-xl text-base leading-7 sm:text-lg'>{copy.description}</p>
        <div className='mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center'>
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
        </div>
      </div>
    </section>
  );

  if (!authenticated) {
    return <main className='flex min-h-[100dvh]'>{errorContent}</main>;
  }

  return (
    <div className='flex min-h-[100dvh] flex-col'>
      <SCHeaderSession />
      <main className='flex flex-1'>{errorContent}</main>
      <SCFooterSession />
    </div>
  );
}
