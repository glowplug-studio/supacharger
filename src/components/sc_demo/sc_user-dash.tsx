'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import { SCDashboard } from '@/components/sc_demo/sc_dashboard';

export default function SCUserDash() {
  const t = useTranslations('DashboardDemo');
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountConfirmed = searchParams.get('account_confirmed');

  useEffect(() => {
    if (accountConfirmed !== '1') return;

    toast.success(t('accountConfirmed'));
    const params = new URLSearchParams(window.location.search);
    params.delete('account_confirmed');
    const nextUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    router.replace(nextUrl, { scroll: false });
  }, [accountConfirmed, router, t]);

  return <SCDashboard />;
}
