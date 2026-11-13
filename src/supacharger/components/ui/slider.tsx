import { cn } from '@/utils/cn';
import { Slider as SliderPrimitive } from '@base-ui/react/slider';

function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [value ?? defaultValue ?? min];

  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      data-slot='slider'
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment='edge'
      {...props}
    >
      <SliderPrimitive.Control className='relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col'>
        <SliderPrimitive.Track
          data-slot='slider-track'
          className='relative h-1.5 w-full grow overflow-hidden rounded-full bg-neutral-900/20 dark:bg-neutral-50/20'
        >
          <SliderPrimitive.Indicator
            data-slot='slider-range'
            className='absolute h-full bg-neutral-900 dark:bg-neutral-50'
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot='slider-thumb'
            key={index}
            className='block h-4 w-4 rounded-full border border-neutral-200 border-neutral-900/50 bg-white shadow transition-colors focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-300'
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
