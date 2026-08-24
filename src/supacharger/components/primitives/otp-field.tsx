'use client';

import * as React from 'react';

import * as OTPPrimitive from '@radix-ui/react-one-time-password-field';

type OtpFieldProps = React.ComponentPropsWithoutRef<typeof OTPPrimitive.Root> & {
  length?: number;
};

export const OtpField = React.forwardRef<React.ElementRef<typeof OTPPrimitive.Root>, OtpFieldProps>(
  ({ length = 6, className, placeholder, value, defaultValue, onValueChange, ...props }, ref) => {
    const resolvedPlaceholder = placeholder ?? '0'.repeat(length);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? '');
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
    const displayValue = value ?? uncontrolledValue;
    const separatorIndex = Math.ceil(length / 2) - 1;

    return (
      <OTPPrimitive.Root
        {...props}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(nextValue) => {
          if (value === undefined) setUncontrolledValue(nextValue);
          onValueChange?.(nextValue);
        }}
        className={['sc-otp-field', className].filter(Boolean).join(' ')}
        data-length={length}
      >
        {Array.from({ length }).map((_, index) => (
          <React.Fragment key={index}>
            <span className='sc-otp-slot' data-active={focusedIndex === index ? 'true' : 'false'}>
              <OTPPrimitive.Input
                index={index}
                className='sc-otp-input'
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex((currentIndex) => (currentIndex === index ? null : currentIndex))}
              />
              {!displayValue[index] && focusedIndex !== index ? (
                <span className='sc-otp-placeholder' aria-hidden='true'>
                  {resolvedPlaceholder[index] ?? ''}
                </span>
              ) : null}
            </span>
            {index === separatorIndex && index < length - 1 ? (
              <span className='sc-otp-separator' aria-hidden='true' />
            ) : null}
          </React.Fragment>
        ))}
        <OTPPrimitive.HiddenInput />
      </OTPPrimitive.Root>
    );
  },
);

OtpField.displayName = 'OtpField';
