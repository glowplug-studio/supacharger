'use client';

import * as React from 'react';

import { useRender } from '@base-ui/react/use-render';

export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...props }, ref) =>
  useRender({
    render: children as React.ReactElement,
    ref,
    props,
  }),
);
Slot.displayName = 'Slot';
