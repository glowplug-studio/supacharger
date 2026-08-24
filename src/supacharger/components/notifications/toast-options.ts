'use client';

import { Bounce, Flip, Slide, type ToastOptions, type ToastTransition,Zoom } from 'react-toastify';

import type { SupachargerConfig } from '@/supacharger/supacharger-config-contract';

const transitions: Record<SupachargerConfig['TOAST_CONFIG']['transition'], ToastTransition> = {
  bounce: Bounce,
  flip: Flip,
  slide: Slide,
  zoom: Zoom,
};

export function resolveToastOptions(config: SupachargerConfig['TOAST_CONFIG']): ToastOptions {
  return {
    ...config,
    transition: transitions[config.transition],
  };
}
