'use client';

import * as React from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { useRender } from '@base-ui/react/use-render';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  render?: BaseButton.Props['render'];
  nativeButton?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      size = 'default',
      type = 'button',
      variant = 'default',
      render,
      nativeButton,
      children,
      ...props
    },
    ref,
  ) => {
    const shared = {
      ...props,
      className: ['sc-control-button', className].filter(Boolean).join(' '),
      'data-size': size,
      'data-variant': variant,
    };
    const child = useRender({
      enabled: asChild,
      ref,
      render: asChild ? (children as React.ReactElement) : undefined,
      props: shared,
    });
    if (asChild) return child;
    return (
      <BaseButton {...shared} ref={ref} type={type} render={render} nativeButton={nativeButton}>
        {children}
      </BaseButton>
    );
  },
);
Button.displayName = 'Button';
