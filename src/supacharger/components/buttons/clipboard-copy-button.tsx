'use client';

import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ClipboardCopy } from 'lucide-react';

import { Button } from '@/supacharger/components/primitives/button';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

const Tooltip = TooltipPrimitive.Root;
const TooltipProvider = TooltipPrimitive.Provider;
const TooltipTrigger = TooltipPrimitive.Trigger;

type Props = Omit<ComponentProps<typeof Button>, 'onClick' | 'asChild' | 'value'> & {
  value: string;
  iconClassName?: string;
};

export type ClipboardCopyButtonMessages = {
  clickToCopy: string;
  copied: string;
  failed: string;
};

export function ClipboardCopyButtonBase({
  value,
  children,
  disabled,
  iconClassName = 'size-4 shrink-0',
  messages,
  ...props
}: Props & { messages: ClipboardCopyButtonMessages }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  async function copy() {
    let next: 'copied' | 'failed' = 'copied';
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      next = 'failed';
    }
    if (!mounted.current) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus(next);
    setOpen(true);
    timer.current = setTimeout(() => {
      setOpen(false);
      setStatus('idle');
    }, 2500);
  }
  return (
    <TooltipProvider delay={0}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          if (status === 'idle') setOpen(next);
        }}
      >
        <TooltipTrigger
          render={
            <Button
              type='button'
              aria-label={messages.clickToCopy}
              {...props}
              disabled={disabled}
              onClick={() => void copy()}
            >
              {status === 'copied' ? (
                <Check aria-hidden='true' className={iconClassName} />
              ) : (
                <ClipboardCopy aria-hidden='true' className={iconClassName} />
              )}
              {children}
            </Button>
          }
        />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner sideOffset={4} className='z-50'>
            <TooltipPrimitive.Popup className='animate-in fade-in-0 zoom-in-95 z-50 rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-neutral-50 motion-reduce:animate-none'>
              <span role='status'>{messages[status === 'idle' ? 'clickToCopy' : status]}</span>
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ClipboardCopyButton(props: Props) {
  const t = useTranslations('Clipboard');
  return (
    <ClipboardCopyButtonBase
      {...props}
      messages={{
        clickToCopy: t('clickToCopy'),
        copied: t('copied'),
        failed: t('failed'),
      }}
    />
  );
}
