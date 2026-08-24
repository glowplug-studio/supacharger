import * as React from 'react';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => <textarea {...props} ref={ref} className={['sc-control-textarea', className].filter(Boolean).join(' ')} />,
);
Textarea.displayName = 'Textarea';
