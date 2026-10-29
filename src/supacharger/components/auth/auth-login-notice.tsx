'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import {
  AUTH_LOGIN_NOTICE_PARAM,
  AUTH_LOGIN_NOTICE_VALUE,
} from '@/supacharger/auth/login-redirect';
import { OAUTH_CANCELLED_NOTICE } from '@/supacharger/auth/oauth-cancellation';
import { resolveToastOptions } from '@/supacharger/components/notifications/toast-options';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import englishMessages from '../../../../messages/en.json';

export function AuthLoginNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('AuthTerms');
  const loggedIn = searchParams.get(AUTH_LOGIN_NOTICE_PARAM) === AUTH_LOGIN_NOTICE_VALUE;

  const cancelled = pathname === '/account/login' && searchParams.get(AUTH_LOGIN_NOTICE_PARAM) === OAUTH_CANCELLED_NOTICE;

  useEffect(() => {
    if (!loggedIn && !cancelled) return;

    const notify = cancelled ? toast.info : toast.success;
    const message = cancelled
      ? (t.has('loginCancelled') && t('loginCancelled')) || englishMessages.AuthTerms.loginCancelled
      : t('loginSuccess');
    notify(message, {
      ...resolveToastOptions(SC_CONFIG.TOAST_CONFIG),
      toastId: cancelled ? 'auth-login:cancelled' : 'auth-login:success',
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete(AUTH_LOGIN_NOTICE_PARAM);
    const query = params.toString();
    router.replace(`${pathname || '/'}${query ? `?${query}` : ''}`, { scroll: false });
  }, [cancelled, loggedIn, pathname, router, searchParams, t]);

  return null;
}
