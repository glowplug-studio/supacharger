import type { ComponentProps } from 'react';

import InlineLoader from '@/assets/svgr/ui/inline-loader.svg';
import InlineLoaderDark from '@/assets/svgr/ui/inline-loader-dark.svg';
import { cn } from '@/utils/cn';

type LoadingSpinnerProps = ComponentProps<typeof InlineLoader> & {
  label?: string;
  variant?: 'default' | 'dark';
};

export function LoadingSpinner({
  className,
  fill = 'currentColor',
  label,
  variant = 'default',
  ...props
}: LoadingSpinnerProps) {
  const Loader = variant === 'dark' ? InlineLoaderDark : InlineLoader;

  return (
    <Loader
      className={cn('shrink-0', className)}
      fill={fill}
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      role={label ? 'status' : undefined}
      {...props}
    />
  );
}
