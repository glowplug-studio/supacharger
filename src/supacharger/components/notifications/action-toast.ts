'use client';

import { toast } from 'react-toastify';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { resolveToastOptions } from './toast-options';

export function showActionToast(kind: 'error' | 'success', message: string) {
  const options = resolveToastOptions(SC_CONFIG.TOAST_CONFIG);
  if (kind === 'success') toast.success(message, options);
  else toast.error(message, options);
}
