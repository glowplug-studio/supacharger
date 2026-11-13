'use client';

import { useEffect, useState } from 'react';
import { Check, Clipboard, TriangleAlert } from 'lucide-react';

import { Button } from '@/supacharger/components/ui/button';

type CopyStatus = 'copied' | 'error' | 'idle';

export function SCCopyCodeButton({
  code,
  copiedLabel,
  copyLabel,
  errorLabel,
}: {
  code: string;
  copiedLabel: string;
  copyLabel: string;
  errorLabel: string;
}) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (status === 'idle') return;

    const timeout = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }

  const Icon = status === 'copied' ? Check : status === 'error' ? TriangleAlert : Clipboard;
  const label = status === 'copied' ? copiedLabel : status === 'error' ? errorLabel : copyLabel;

  return (
    <Button aria-live='polite' onClick={copyCode} size='sm' type='button' variant='outline'>
      <Icon aria-hidden='true' className='size-4' />
      {label}
    </Button>
  );
}
