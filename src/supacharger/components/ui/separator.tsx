'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';
import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive>,
  React.ComponentPropsWithoutRef<'div'> & { orientation?: 'vertical' | 'horizontal'; decorative?: boolean }
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive
    ref={ref}
    role={decorative ? 'presentation' : 'separator'}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-neutral-200 dark:bg-neutral-800',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.displayName;

export { Separator };
