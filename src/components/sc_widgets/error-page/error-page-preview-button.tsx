'use client';

import { useRef, useState } from 'react';
import { useMessages } from 'next-intl';

import { Button } from '@/components/ui/button';

import { ApplicationErrorContent } from './application-error-content';
import { resolveApplicationErrorCopy } from './application-error-copy';

/** Uses the real error presentation; a document reload resets this transient preview. */
export function ErrorPagePreviewButton({
  className,
  kind,
  label,
  reloadHint,
}: {
  className?: string;
  kind: 'notFound' | 'outage';
  label: string;
  reloadHint: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(false);
  const messages = useMessages();

  return (
    <>
      <Button
        className={className}
        onClick={() => {
          setActive(true);
          dialog.current?.showModal();
        }}
      >
        {label}
      </Button>
      <dialog
        ref={dialog}
        aria-label={label}
        onCancel={(event) => event.preventDefault()}
        className='bg-background text-foreground fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 p-0'
      >
        {active &&
          (kind === 'outage' ? (
            <iframe title={label} src='/auth/unavailable?demo=1' className='h-full w-full border-0' />
          ) : (
            <main className='flex min-h-[100dvh]'>
              <ApplicationErrorContent
                copy={resolveApplicationErrorCopy(messages, 'notFound')}
                homeHref='/'
                reloadHint={reloadHint}
              />
            </main>
          ))}
      </dialog>
    </>
  );
}
