import * as React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => <input {...props} ref={ref} className={['sc-control-input', className].filter(Boolean).join(' ')} />,
);
Input.displayName = 'Input';
