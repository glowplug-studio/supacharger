'use client';

import { useEffect, useRef } from 'react';

import DemoLogo01 from '@/components/sc_demo/assets/logos/demo-logo-01.svg';
import DemoLogo02 from '@/components/sc_demo/assets/logos/demo-logo-02.svg';
import DemoLogo03 from '@/components/sc_demo/assets/logos/demo-logo-03.svg';
import DemoLogo04 from '@/components/sc_demo/assets/logos/demo-logo-04.svg';
import DemoLogo05 from '@/components/sc_demo/assets/logos/demo-logo-05.svg';
import DemoLogo06 from '@/components/sc_demo/assets/logos/demo-logo-06.svg';
import DemoLogo07 from '@/components/sc_demo/assets/logos/demo-logo-07.svg';
import DemoLogo08 from '@/components/sc_demo/assets/logos/demo-logo-08.svg';
import DemoLogo09 from '@/components/sc_demo/assets/logos/demo-logo-09.svg';

const demoLogos = [
  DemoLogo01,
  DemoLogo02,
  DemoLogo03,
  DemoLogo04,
  DemoLogo05,
  DemoLogo06,
  DemoLogo07,
  DemoLogo08,
  DemoLogo09,
];

const playbackRateTransitionMs = 700;
const marqueeLoopDurationMs = 60_000;

function smoothStep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function DemoLogoSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      aria-hidden={duplicate ? 'true' : undefined}
      className='sc-logo-marquee-set flex shrink-0 items-center gap-12 px-6'
    >
      {demoLogos.map((Logo, index) => (
        <div className='sc-logo-marquee-item flex h-[70px] w-[135px] shrink-0 items-center justify-center' key={index}>
          <Logo aria-hidden='true' className='sc-logo-marquee-logo h-[70px] w-[135px]' focusable='false' />
        </div>
      ))}
    </div>
  );
}

export default function SCLogoMarquee({ label }: { label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousFrameRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const playbackRateRef = useRef(1);
  const playbackTransitionRef = useRef<{
    duration: number;
    from: number;
    startedAt: number;
    to: number;
  } | null>(null);

  const transitionPlaybackRate = (targetRate: number) => {
    const initialRate = playbackRateRef.current;
    playbackTransitionRef.current = {
      duration: Math.max(120, playbackRateTransitionMs * Math.abs(targetRate - initialRate)),
      from: initialRate,
      startedAt: performance.now(),
      to: targetRate,
    };
  };

  const slowMarquee = () => transitionPlaybackRate(0);
  const resumeMarquee = () => transitionPlaybackRate(1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animate = (now: number) => {
      const previousFrame = previousFrameRef.current ?? now;
      const elapsed = Math.min(now - previousFrame, 64);
      previousFrameRef.current = now;

      const transition = playbackTransitionRef.current;
      if (transition) {
        const progress = Math.min((now - transition.startedAt) / transition.duration, 1);
        playbackRateRef.current = transition.from + (transition.to - transition.from) * smoothStep(progress);
        if (progress === 1) playbackTransitionRef.current = null;
      }

      const loopWidth = track.scrollWidth / 2;
      if (loopWidth > 0) {
        offsetRef.current -= (loopWidth / marqueeLoopDurationMs) * elapsed * playbackRateRef.current;
        if (-offsetRef.current >= loopWidth) offsetRef.current += loopWidth;
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div
      aria-labelledby='sc-logo-marquee-label'
      className='sc-logo-marquee mt-10 w-full'
      onPointerEnter={slowMarquee}
      onPointerLeave={resumeMarquee}
      role='region'
    >
      <p className='text-muted-foreground text-center text-sm font-medium' id='sc-logo-marquee-label'>
        {label}
      </p>
      <div className='mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]'>
        <div className='sc-logo-marquee-track flex w-max items-center' ref={trackRef}>
          <DemoLogoSet />
          <DemoLogoSet duplicate />
        </div>
      </div>
    </div>
  );
}
