'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Backdrop>,
  Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Backdrop>, 'className' | 'children'> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Backdrop
    className={cn(
      'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/80',
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Backdrop.displayName;

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-white p-6 shadow-lg transition ease-in-out data-closed:duration-300 data-open:duration-500 data-open:animate-in data-closed:animate-out dark:bg-neutral-950',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-closed:slide-out-to-top data-open:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-closed:slide-out-to-bottom data-open:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-closed:slide-out-to-left data-open:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-closed:slide-out-to-right data-open:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

type SheetContentProps = Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Popup>, 'className' | 'children'> & {
  className?: string;
  children?: React.ReactNode;
} & VariantProps<typeof sheetVariants>;

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Popup>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        <SheetPrimitive.Close className='absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-open:bg-neutral-100 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300 dark:data-open:bg-neutral-800'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Popup>
    </SheetPortal>
  ),
);
SheetContent.displayName = SheetPrimitive.Popup.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-6 flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>, 'className' | 'children'> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-neutral-950 dark:text-neutral-50', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>, 'className' | 'children'> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
