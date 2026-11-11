'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function DemoConfetti({ active, fullPage = false }: { active: boolean; fullPage?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    let previous = 0;
    const pieces = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: -Math.random(),
      speed: 0.12 + Math.random() * 0.18,
      angle: Math.random() * 6,
      colour: ['#10b981', '#38bdf8', '#fbbf24', '#f472b6'][Math.floor(Math.random() * 4)],
    }));
    function draw(time: number) {
      if (!canvas || !context) return;
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.scale(devicePixelRatio, devicePixelRatio);
      for (const p of pieces) {
        p.y += p.speed * dt;
        if (p.y > 1.05) p.y = -0.05;
        p.angle += dt;
        context.save();
        context.translate(p.x * width, p.y * height);
        context.rotate(p.angle);
        context.fillStyle = p.colour;
        context.fillRect(-3, -5, 6, 10);
        context.restore();
      }
      frame = requestAnimationFrame(draw);
    }
    const stop = () => {
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
    const change = () => {
      stop();
      if (!preference.matches) {
        previous = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    preference.addEventListener('change', change);
    frame = requestAnimationFrame(draw);
    return () => {
      stop();
      preference.removeEventListener('change', change);
    };
  }, [active]);
  return active ? (
    <canvas
      ref={ref}
      aria-hidden='true'
      className={`${fullPage ? 'fixed z-[60]' : 'absolute z-0'} pointer-events-none inset-0 h-full w-full`}
    />
  ) : null;
}

export function DemoConfettiToggle() {
  const t = useTranslations('DemoCelebration');
  const [active, setActive] = useState(false);
  return (
    <div className='flex w-full flex-col gap-3'>
      <DemoConfetti active={active} fullPage />
      <Button className='relative z-10 w-full rounded-lg' type='button' variant='outline' aria-pressed={active} onClick={() => setActive(!active)}>
        {t('confetti')}
      </Button>
      <DemoConfettiJsTrigger />
    </div>
  );
}

export function DemoConfettiJsTrigger() {
  const t = useTranslations('DemoCelebration');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const trigger = async () => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    const { default: confetti } = await import('@hiseb/confetti');
    const button = buttonRef.current;
    if (!button || document.hidden || preference.matches) return;
    const rect = button.getBoundingClientRect();
    confetti({
      position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      count: 60,
      velocity: 200,
      fade: true,
    });
  };

  return (
    <Button
      ref={buttonRef}
      className='relative z-10 w-full rounded-lg'
      type='button'
      variant='outline'
      onClick={trigger}
    >
      {t('confettiJs')}
    </Button>
  );
}
