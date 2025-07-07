'use client';

import Link from 'next/link';

import * as Dialog from '@radix-ui/react-dialog';

interface FullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogHeader?: React.ReactNode;
  dialogTitle: string;
  dialogDescription?: string;
  dialogContent: React.ReactNode;
}

export default function FullScreenDialog({
  open,
  onOpenChange,
  dialogHeader,
  dialogTitle,
  dialogDescription,
  dialogContent,
}: FullScreenDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-40 bg-black/40 backdrop-blur-lg' />
        <Dialog.Content
          className='
          fixed inset-0 z-50 flex items-center justify-center p-0
        '
        >
          <div
            className='
            m-12 flex h-[calc(100vh-theme(spacing.24))] w-full flex-col
            items-center
            justify-center rounded-lg bg-background px-8
            py-6 shadow-xl
          '
          >
            {dialogHeader && <div className='mb-4'>{dialogHeader}</div>}
            <h1 className='mb-2 text-center text-3xl font-bold'>{dialogTitle}</h1>
            {dialogDescription && <p className='mb-6 text-center text-lg text-muted-foreground'>{dialogDescription}</p>}
            <div className='flex w-full flex-col items-center'>{dialogContent}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
