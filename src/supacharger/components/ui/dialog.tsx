'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Backdrop>,
  Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>, 'className' | 'children'> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn(
      'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/80',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Backdrop.displayName;

type DialogContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>,
  'className' | 'children'
> & { className?: string; children?: React.ReactNode } & {
  motion?: 'default' | 'fade';
};

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Popup>, DialogContentProps>(
  ({ className, children, motion = 'default', ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={ref}
        className={cn(
          'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-white p-6 shadow-lg duration-200 sm:rounded-lg dark:border-neutral-800 dark:bg-neutral-950',
          motion === 'default' &&
            'data-closed:zoom-out-95 data-open:zoom-in-95 data-closed:slide-out-to-left-1/2 data-closed:slide-out-to-top-[48%] data-open:slide-in-from-left-1/2 data-open:slide-in-from-top-[48%]',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className='absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-open:bg-neutral-100 data-open:text-neutral-500 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300 dark:data-open:bg-neutral-800 dark:data-open:text-neutral-400'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Popup.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>, 'className' | 'children'> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg leading-none font-semibold tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>, 'className' | 'children'> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
