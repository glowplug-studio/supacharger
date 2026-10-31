import { getMessages } from 'next-intl/server';

import SCFooterSession from '@/components/sc_demo/sc_footer-session';
import { SCHeaderSession } from '@/components/sc_demo/sc_header-session';
import { isLoggedIn } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { ApplicationErrorContent } from './application-error-content';
import {
  type ApplicationErrorKind,
  resolveApplicationErrorCopy,
} from './application-error-copy';

type ApplicationErrorPageProps = {
  kind: ApplicationErrorKind;
};

export async function ApplicationErrorPage({ kind }: ApplicationErrorPageProps) {
  const [authenticated, messages] = await Promise.all([isLoggedIn(), getMessages()]);
  const copy = resolveApplicationErrorCopy(messages, kind);
  const homeHref = authenticated
    ? SC_CONFIG.USER_REDIRECTS.AUTHED_USER.HOME_PATH
    : SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.HOME_PATH;

  const errorContent = <ApplicationErrorContent copy={copy} homeHref={homeHref} />;

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
