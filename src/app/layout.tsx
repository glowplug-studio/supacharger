import { PropsWithChildren, Suspense } from 'react';
import { Instrument_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';

import SupachargerPageHooks from '@/supacharger.adapters/generated/page-hooks';
import { AuthConfirmationNotice } from '@/supacharger/components/auth/auth-confirmation-notice';
import { AuthLoginNotice } from '@/supacharger/components/auth/auth-login-notice';
import { SmoothAnchorNavigation } from '@/supacharger/components/layout/smooth-anchor-navigation';
import { SupachargerToastContainer } from '@/supacharger/components/notifications/supacharger-toast-container';
import {
  createSupachargerMetadata,
  createSupachargerViewport,
  SupachargerAnalytics,
} from '@/supacharger/root-document';
import { localisedSiteConfig } from '@/supacharger/site-identity';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

import '@/supacharger/styles/globals.css';

// Locale and messages are selected from a request cookie before the document
// can render, so the root is intentionally allowed to block.
export const instant = false;

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
});

export async function generateMetadata() {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return createSupachargerMetadata(localisedSiteConfig(messages), locale);
}
export const viewport = createSupachargerViewport(SC_CONFIG);

export default async function RootLayout({ children }: PropsWithChildren) {
  const [locale, messages, global] = await Promise.all([getLocale(), getMessages(), getTranslations('Global')]);
  const applicationContent = (
    <>
      <Suspense fallback={null}>
        <AuthConfirmationNotice />
        <AuthLoginNotice />
      </Suspense>
      {children}
    </>
  );
  const themedContent = SC_CONFIG.ROOT_PROVIDERS.THEME ? (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      {applicationContent}
    </ThemeProvider>
  ) : (
    applicationContent
  );
  const content = SC_CONFIG.ROOT_PROVIDERS.INTERNATIONALISATION ? (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {themedContent}
    </NextIntlClientProvider>
  ) : (
    themedContent
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn('font-sans antialiased', instrumentSans.variable)}>
        <a
          className='bg-background text-foreground focus-visible:ring-ring pointer-events-none fixed top-3 left-3 z-50 -translate-y-24 rounded-lg px-4 py-3 font-medium opacity-0 shadow-sm transition focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus-visible:ring-2 focus-visible:outline-none'
          href='#main-content'
        >
          {global('skipToContent')}
        </a>
        <SmoothAnchorNavigation />
        <div id='main-content' tabIndex={-1}>
          {content}
        </div>
        {SC_CONFIG.ROOT_PROVIDERS.TOASTS ? <SupachargerToastContainer config={SC_CONFIG.TOAST_CONFIG} /> : null}
        <Suspense fallback={null}>
          <SupachargerPageHooks />
        </Suspense>
        <SupachargerAnalytics config={SC_CONFIG} />
      </body>
    </html>
  );
}
