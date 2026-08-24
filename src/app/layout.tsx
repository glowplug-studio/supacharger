import { PropsWithChildren, Suspense } from 'react';
import { Host_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';

import { AuthConfirmationNotice } from '@/supacharger/components/auth/auth-confirmation-notice';
import { AuthLoginNotice } from '@/supacharger/components/auth/auth-login-notice';
import { SmoothAnchorNavigation } from '@/supacharger/components/layout/smooth-anchor-navigation';
import { SupachargerToastContainer } from '@/supacharger/components/notifications/supacharger-toast-container';
import {
  createSupachargerMetadata,
  createSupachargerViewport,
  SupachargerAnalytics,
} from '@/supacharger/root-document';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

import '@/supacharger/styles/globals.css';

// Locale and messages are selected from a request cookie before the document
// can render, so the root is intentionally allowed to block.
export const instant = false;

const hostGrotesk = Host_Grotesk({
  variable: '--font-host-grotesk',
  subsets: ['latin'],
});

export const metadata = createSupachargerMetadata(SC_CONFIG);
export const viewport = createSupachargerViewport(SC_CONFIG);

export default async function RootLayout({ children }: PropsWithChildren) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
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
      <body className={cn('font-sans antialiased', hostGrotesk.variable)}>
        <SmoothAnchorNavigation />
        {content}
        {SC_CONFIG.ROOT_PROVIDERS.TOASTS ? <SupachargerToastContainer config={SC_CONFIG.TOAST_CONFIG} /> : null}
        <SupachargerAnalytics config={SC_CONFIG} />
      </body>
    </html>
  );
}
