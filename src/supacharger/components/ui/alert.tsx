import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const alertVariants = cva(
  'relative w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-neutral-950 [&>svg~*]:pl-7 dark:border-neutral-800 dark:[&>svg]:text-neutral-50',
  {
    variants: {
      variant: {
        default: 'bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50',
        destructive:
          'border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot='alert' role='alert' className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot='alert-title' className={cn('mb-1 leading-none font-medium tracking-tight', className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='alert-description' className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='alert-action' className={cn('absolute top-2 right-2', className)} {...props} />;
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
