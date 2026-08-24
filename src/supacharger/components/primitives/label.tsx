'use client';

import * as React from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';

export const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(
  ({ className, ...props }, ref) => <LabelPrimitive.Root {...props} ref={ref} className={['sc-control-label', className].filter(Boolean).join(' ')} />,
);
Label.displayName = 'Label';
