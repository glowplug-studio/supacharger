'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import {
  AUTH_LOGIN_NOTICE_PARAM,
  AUTH_LOGIN_NOTICE_VALUE,
} from '@/supacharger/auth/login-redirect';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export function AuthLoginNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('AuthTerms');
  const loggedIn = searchParams.get(AUTH_LOGIN_NOTICE_PARAM) === AUTH_LOGIN_NOTICE_VALUE;

  useEffect(() => {
    if (!loggedIn) return;

    toast.success(t('loginSuccess'), {
      ...SC_CONFIG.TOAST_CONFIG,
      toastId: 'auth-login:success',
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete(AUTH_LOGIN_NOTICE_PARAM);
    const query = params.toString();
    router.replace(`${pathname || '/'}${query ? `?${query}` : ''}`, { scroll: false });
  }, [loggedIn, pathname, router, searchParams, t]);

  return null;
}
