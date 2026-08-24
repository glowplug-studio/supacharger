'use client';

import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size = 'default', type = 'button', variant = 'default', ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return <Component {...props} ref={ref} type={asChild ? undefined : type} className={['sc-control-button', className].filter(Boolean).join(' ')} data-size={size} data-variant={variant} />;
  },
);
Button.displayName = 'Button';
