'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import { AUTH_CONFIRMATION_NOTICE_PARAM } from '@/supacharger/auth/confirmation-redirect';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export function AuthConfirmationNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('AuthTerms');
  const accountConfirmed = searchParams.get('account_confirmed') === '1';
  const notice = searchParams.get(AUTH_CONFIRMATION_NOTICE_PARAM);

  useEffect(() => {
    if (!accountConfirmed && !notice) return;

    if (notice === 'already-signed-in') {
      toast.info(
        t.has('confirmationLinkAlreadyUsedSignedIn')
          ? t('confirmationLinkAlreadyUsedSignedIn')
          : 'This confirmation link has expired or was already used. You are already signed in.',
        SC_CONFIG.TOAST_CONFIG,
      );
    } else if (notice === 'sign-in') {
      toast.info(
        t.has('confirmationLinkAlreadyUsedSignIn')
          ? t('confirmationLinkAlreadyUsedSignIn')
          : 'This confirmation link has expired or was already used. If your account is already activated, sign in below.',
        SC_CONFIG.TOAST_CONFIG,
      );
    } else if (accountConfirmed) {
      toast.success(t('accountEmailVerified'), SC_CONFIG.TOAST_CONFIG);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('account_confirmed');
    params.delete(AUTH_CONFIRMATION_NOTICE_PARAM);
    const query = params.toString();
    router.replace(`${pathname || '/'}${query ? `?${query}` : ''}`, { scroll: false });
  }, [accountConfirmed, notice, pathname, router, searchParams, t]);

  return null;
}
