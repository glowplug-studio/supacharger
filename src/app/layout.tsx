import { PropsWithChildren } from 'react';
import { Host_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';

import { SmoothAnchorNavigation } from '@/supacharger/components/layout/smooth-anchor-navigation';
import {
  createSupachargerMetadata,
  createSupachargerViewport,
  SupachargerAnalytics,
} from '@/supacharger/root-document';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

import '@/supacharger/styles/globals.css';

export const dynamic = 'force-dynamic';

const hostGrotesk = Host_Grotesk({
  variable: '--font-host-grotesk',
  subsets: ['latin'],
});

export const metadata = createSupachargerMetadata(SC_CONFIG);
export const viewport = createSupachargerViewport(SC_CONFIG);

export default async function RootLayout({ children }: PropsWithChildren) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const themedContent = SC_CONFIG.ROOT_PROVIDERS.THEME ? (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      {children}
    </ThemeProvider>
  ) : (
    children
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
        {SC_CONFIG.ROOT_PROVIDERS.TOASTS ? <ToastContainer {...SC_CONFIG.TOAST_CONFIG} /> : null}
      </body>
      <SupachargerAnalytics config={SC_CONFIG} />
    </html>
  );
}
