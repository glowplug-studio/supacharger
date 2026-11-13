'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { EmblaCarouselType, EmblaEventType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/supacharger/components/ui/button';

const TWEEN_FACTOR_BASE = 0.2;

const fernSlides = [
  {
    credit: 'Matthew Stephenson',
    href: 'https://unsplash.com/photos/fern-leaves-close-up-lit-by-the-sun-rNbyCIKxk9M',
    src: 'https://images.unsplash.com/photo-1752068306514-b8bf67ac4c38?auto=format&fit=crop&w=960&q=75',
  },
  {
    credit: 'Valentin Dragomir',
    href: 'https://unsplash.com/photos/a-close-up-of-a-green-fern-leaf-yIeIi4i8Vfc',
    src: 'https://images.unsplash.com/photo-1699126295331-bc137941fa56?auto=format&fit=crop&w=960&q=75',
  },
  {
    credit: 'Matt Richmond',
    href: 'https://unsplash.com/photos/a-close-up-of-a-fern-leaf-in-the-dark-wAttQSesKWo',
    src: 'https://images.unsplash.com/photo-1715412945094-defe72d0e09a?auto=format&fit=crop&w=960&q=75',
  },
] as const;

export function SCEmblaParallaxCarousel({
  label,
  nextLabel,
  photoByLabel,
  previousLabel,
  slideAlts,
  slideLabel,
}: {
  label: string;
  nextLabel: string;
  photoByLabel: string;
  previousLabel: string;
  slideAlts: readonly string[];
  slideLabel: (current: number, total: number) => string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const reduceMotion = useRef(false);
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);

  const setTweenNodes = useCallback((api: EmblaCarouselType) => {
    tweenNodes.current = api.slideNodes().map((slideNode) => {
      const tweenNode = slideNode.querySelector<HTMLElement>('[data-parallax-layer]');
      if (!tweenNode) throw new Error('Embla parallax layer is missing');
      return tweenNode;
    });
  }, []);

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  const tweenParallax = useCallback((api: EmblaCarouselType, eventName?: EmblaEventType) => {
    if (reduceMotion.current) {
      tweenNodes.current.forEach((node) => {
        node.style.transform = 'translateX(0)';
      });
      return;
    }

    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === 'scroll';

    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex !== loopItem.index || target === 0) return;

            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          });
        }

        const translate = diffToTarget * (-1 * tweenFactor.current) * 100;
        tweenNodes.current[slideIndex].style.transform = `translateX(${translate}%)`;
      });
    });
  }, []);

  const updateSelectedIndex = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      reduceMotion.current = motionPreference.matches;
      tweenParallax(emblaApi);
    };

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    updateMotionPreference();
    updateSelectedIndex(emblaApi);

    motionPreference.addEventListener('change', updateMotionPreference);
    emblaApi
      .on('reInit', setTweenNodes)
      .on('reInit', setTweenFactor)
      .on('reInit', tweenParallax)
      .on('reInit', updateSelectedIndex)
      .on('scroll', tweenParallax)
      .on('select', updateSelectedIndex)
      .on('slideFocus', tweenParallax);

    return () => {
      motionPreference.removeEventListener('change', updateMotionPreference);
      emblaApi
        .off('reInit', setTweenNodes)
        .off('reInit', setTweenFactor)
        .off('reInit', tweenParallax)
        .off('reInit', updateSelectedIndex)
        .off('scroll', tweenParallax)
        .off('select', updateSelectedIndex)
        .off('slideFocus', tweenParallax);
    };
  }, [emblaApi, setTweenFactor, setTweenNodes, tweenParallax, updateSelectedIndex]);

  return (
    <div aria-label={label} aria-roledescription='carousel' role='region'>
      <div ref={emblaRef} className='overflow-hidden rounded-lg'>
        <div className='-ml-3 flex touch-pan-y'>
          {fernSlides.map((slide, index) => (
            <div
              aria-label={slideLabel(index + 1, fernSlides.length)}
              aria-roledescription='slide'
              className='min-w-0 flex-[0_0_86%] pl-3'
              key={slide.src}
              role='group'
            >
              <div className='aspect-[4/3] overflow-hidden rounded-lg'>
                <div className='relative flex h-full w-full justify-center' data-parallax-layer>
                  <div className='relative h-full w-[116%] max-w-none shrink-0'>
                    <Image
                      fill
                      alt={slideAlts[index] ?? ''}
                      className='object-cover'
                      loading='lazy'
                      sizes='(min-width: 1024px) 36vw, 75vw'
                      src={slide.src}
                    />
                    <a
                      className='absolute right-3 bottom-3 rounded-md bg-black/65 px-2 py-1 text-[11px] text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                      href={slide.href}
                      rel='noreferrer'
                      target='_blank'
                    >
                      {photoByLabel} {slide.credit}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-4'>
        <Button
          aria-label={previousLabel}
          className='size-10 !rounded-full p-0'
          type='button'
          variant='outline'
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ChevronLeft aria-hidden='true' className='size-4' />
        </Button>

        <div aria-label={`${label} pagination`} className='flex items-center justify-center gap-2' role='group'>
          {fernSlides.map((slide, index) => {
            const selected = index === selectedIndex;
            return (
              <Button
                aria-current={selected ? 'true' : undefined}
                aria-label={slideLabel(index + 1, fernSlides.length)}
                className={`size-7 !rounded-full p-0 ${selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
                key={slide.src}
                type='button'
                variant='ghost'
                onClick={() => emblaApi?.scrollTo(index)}
              >
                <span
                  aria-hidden='true'
                  className={`size-2.5 rounded-full ${selected ? 'bg-foreground' : 'bg-muted-foreground/35'}`}
                />
              </Button>
            );
          })}
        </div>

        <Button
          aria-label={nextLabel}
          className='size-10 !rounded-full p-0'
          type='button'
          variant='outline'
          onClick={() => emblaApi?.scrollNext()}
        >
          <ChevronRight aria-hidden='true' className='size-4' />
        </Button>
      </div>
    </div>
  );
}
