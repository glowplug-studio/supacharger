import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';

import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';

import '@/supacharger/styles/globals.css';

export const dynamic = 'force-dynamic';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plusJakartaSans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: SC_CONFIG.SITE_TITLE,
  description: SC_CONFIG.SITE_DESCRIPTION,
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T44MSEP2WQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-T44MSEP2WQ');
          `}
        </Script>
      </head>
      <body className={cn('font-sans antialiased', plusJakartaSans.variable)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            {children}
            <Analytics />
          </ThemeProvider>
        </NextIntlClientProvider>
        <ToastContainer position='bottom-right' autoClose={3000} hideProgressBar={true} />
      </body>
    </html>
  );
}
