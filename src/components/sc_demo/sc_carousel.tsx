'use client';

import { useEffect, useRef,useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type Slide = {
  id: number;
  title: string;
  content: string;
  slideClasses?: string | null;
  slideStyle?: Object | null;
};

export interface CarouselProps {
  slides: Slide[];
  autoScrollInterval?: number;
  transitionDuration?: number;
}

export default function Carousel({ slides, autoScrollInterval = 3000, transitionDuration = 0.5 }: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoScrollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, autoScrollInterval]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div
      className='relative h-full w-full overflow-hidden'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className='absolute inset-0'>
        <AnimatePresence initial={false} mode='wait' custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial='enter'
            animate='center'
            exit='exit'
            transition={{
              x: { type: 'spring', stiffness: 100, damping: 20, duration: 0.8 },
              opacity: { duration: 0.5, ease: 'easeInOut' },
            }}
            className={`absolute inset-0 flex items-center rounded-md ${
              slides[currentSlide].slideClasses ? slides[currentSlide].slideClasses : ''
            }`}
            style={slides[currentSlide].slideStyle ? slides[currentSlide].slideStyle : {}}
          >
            <div className='max-h-full w-full overflow-y-auto px-28'>
              <h2 className='mb-4 text-2xl font-bold'>{slides[currentSlide].title}</h2>
              <div
                className='prose prose-invert max-w-none'
                dangerouslySetInnerHTML={{ __html: slides[currentSlide].content }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={prevSlide}
        className='absolute left-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20'
        aria-label='Previous slide'
      >
        <ChevronLeft className='h-5 w-5' />
      </button>

      <button
        onClick={nextSlide}
        className='absolute right-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20'
        aria-label='Next slide'
      >
        <ChevronRight className='h-5 w-5' />
      </button>

      <div className='absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}