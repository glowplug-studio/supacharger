'use client';

import * as React from 'react';

export const Label = React.forwardRef<React.ElementRef<'label'>, React.ComponentPropsWithoutRef<'label'>>(
  ({ className, ...props }, ref) => (
    <label {...props} ref={ref} className={['sc-control-label', className].filter(Boolean).join(' ')} />
  ),
);
Label.displayName = 'Label';
