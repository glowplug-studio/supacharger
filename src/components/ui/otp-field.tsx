'use client';

import * as React from 'react';

import * as OTPPrimitive from '@radix-ui/react-one-time-password-field';

const OTPField = React.forwardRef<
  React.ElementRef<typeof OTPPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof OTPPrimitive.Root> & { length?: number }
>(({ length = 6, className, id, ...props }, ref) => (
  <OTPPrimitive.Root ref={ref} id={id} {...props} className={className}>
    {Array.from({ length }).map((_, i) => (
      <OTPPrimitive.Input
        key={i}
        className="w-10 h-12 mx-1 text-center text-xl font-semibold border rounded-md"
      />
    ))}
    <OTPPrimitive.HiddenInput />
  </OTPPrimitive.Root>
));
OTPField.displayName = 'OTPField';

export default OTPField;
