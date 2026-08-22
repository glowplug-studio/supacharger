'use client';

import * as React from 'react';

import * as OTPPrimitive from '@radix-ui/react-one-time-password-field';

const OTPField = React.forwardRef<
  React.ElementRef<typeof OTPPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof OTPPrimitive.Root> & { length?: number }
>(({ length = 6, className, id, placeholder, value, defaultValue, onValueChange, ...props }, ref) => {
  const resolvedPlaceholder = placeholder ?? '0'.repeat(length);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? '');
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const displayValue = value ?? uncontrolledValue;

  return (
    <OTPPrimitive.Root
      ref={ref}
      id={id}
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => {
        if (value === undefined) setUncontrolledValue(nextValue);
        onValueChange?.(nextValue);
      }}
      className={`otp-field flex items-center justify-center gap-2 ${className ?? ''}`}
    >
      {Array.from({ length }).map((_, index) => (
        <div className='otp-field-slot relative flex shrink-0' key={index}>
          <OTPPrimitive.Input
            index={index}
            className='otp-field-input h-12 w-10 rounded-md border text-center text-xl font-semibold'
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((currentIndex) => (currentIndex === index ? null : currentIndex))}
          />
          {!displayValue[index] && focusedIndex !== index ? (
            <span
              className='otp-field-placeholder pointer-events-none absolute inset-0 flex items-center justify-center'
              aria-hidden='true'
            >
              {resolvedPlaceholder[index] ?? ''}
            </span>
          ) : null}
        </div>
      ))}
      <OTPPrimitive.HiddenInput />
    </OTPPrimitive.Root>
  );
});
OTPField.displayName = 'OTPField';

export default OTPField;
