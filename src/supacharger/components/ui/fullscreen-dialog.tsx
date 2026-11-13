'use client';

import { Dialog } from '@base-ui/react/dialog';

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
        <Dialog.Backdrop className='fixed inset-0 z-40 bg-black/40 backdrop-blur-lg' />
        <Dialog.Popup className='fixed inset-0 z-50 flex items-center justify-center p-0'>
          <div className='bg-background m-12 flex h-[calc(100vh-6rem)] w-full flex-col items-center justify-center rounded-lg px-8 py-6 shadow-xl'>
            {dialogHeader && <div className='mb-4'>{dialogHeader}</div>}
            <Dialog.Title render={<h1 />} className='mb-2 text-center text-3xl font-bold'>
              {dialogTitle}
            </Dialog.Title>
            {dialogDescription && (
              <Dialog.Description className='text-muted-foreground mb-6 text-center text-lg'>
                {dialogDescription}
              </Dialog.Description>
            )}
            <div className='flex w-full flex-col items-center'>{dialogContent}</div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
