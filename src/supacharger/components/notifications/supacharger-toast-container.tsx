'use client';

import { ToastContainer } from 'react-toastify';

import { resolveToastOptions } from '@/supacharger/components/notifications/toast-options';
import type { SupachargerConfig } from '@/supacharger/supacharger-config-contract';

export function SupachargerToastContainer({ config }: { config: SupachargerConfig['TOAST_CONFIG'] }) {
  return <ToastContainer {...resolveToastOptions(config)} />;
}
