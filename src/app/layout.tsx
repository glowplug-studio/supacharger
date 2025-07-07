import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';

import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';

import '@/supacharger/styles/globals.scss';
import '@/styles/globals.scss';

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
  // Get the current locale from cookies
  const cookieStore = await cookies();
  const currentLocale = cookieStore.get('supacharger_locale')?.value || 'en'; // Default to 'en' if not set
  // Load translations for the current locale
  const messages = await import(`../../messages/${currentLocale}.json`).then((module) => module.default);

  return (
    <html lang={currentLocale} suppressHydrationWarning>
      <body className={cn('font-sans antialiased', plusJakartaSans.variable)}>
        <NextIntlClientProvider messages={messages}>
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
