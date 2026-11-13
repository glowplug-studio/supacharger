'use client';

import type { ReactElement } from 'react';

import { AuthEntry } from '@/supacharger/components/forms/auth-entry';
import type { AuthMode } from '@/supacharger/components/forms/login-user-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/supacharger/components/ui/dialog';

/** Editable authentication presentation; access checks remain on the server. */
export function LoginModal({
  trigger,
  title,
  description,
  initialMode = 'signin',
  nextPath,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  initialMode?: AuthMode;
  nextPath?: string | null;
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent
        motion='fade'
        className='sc-login-demo-modal bg-background max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl p-0'
      >
        <div className='grid min-h-[38rem] md:grid-cols-[0.8fr_1.2fr]'>
          <aside className='bg-muted relative hidden overflow-hidden md:block'>
            <div
              className='absolute inset-3 rounded-xl bg-cover bg-center'
              style={{
                backgroundImage:
                  'linear-gradient(to top, rgb(0 0 0 / 0.72), transparent 45%), url(/images/sc_demo/fern-login-sidecar.webp)',
              }}
            />
            <p className='absolute inset-x-7 bottom-7 text-xs text-white/80'>
              Photo by{' '}
              <a
                className='underline hover:text-white'
                href='https://unsplash.com/@akulagin?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText'
                rel='noreferrer'
                target='_blank'
              >
                Artur Kulagin
              </a>{' '}
              on{' '}
              <a
                className='underline hover:text-white'
                href='https://unsplash.com/photos/green-and-white-leaf-plant-ly0IyQtUOCY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText'
                rel='noreferrer'
                target='_blank'
              >
                Unsplash
              </a>
            </p>
          </aside>
          <div className='bg-background flex min-w-0 items-center justify-center px-6 py-10 sm:px-10'>
            <DialogHeader className='sr-only'>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className='sc-auth-page'>
              <AuthEntry initialMode={initialMode} nextPath={nextPath} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
