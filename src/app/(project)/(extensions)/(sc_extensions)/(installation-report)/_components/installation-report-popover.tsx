'use client';

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import InstallationAvatar from '@/supacharger/assets/svgr/brand/supacharger-installation-avatar.svg';
import {
  ClipboardCopyButtonBase,
  type ClipboardCopyButtonMessages,
} from '@/supacharger/components/buttons/clipboard-copy-button';
import { Input } from '@/supacharger/components/ui/input';

import type { InstallationChecklistReport } from '../_lib/checklist';
import type { InstallationConfigReportItem } from '../_lib/config-report';

type ReportTab = 'configuration' | 'progress';
type Position = { x: number; y: number };

const removalPath = 'src/app/(project)/(extensions)/(sc_extensions)/(installation-report)';
const checklistPath = 'docs/reports/sc-install/first-install-handhold-me.md';
const configPath = 'src/supacharger.config.ts';

function ReadonlyPathStrip({
  copyMessages,
  label,
  value,
}: {
  copyMessages: ClipboardCopyButtonMessages;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className='mb-1.5 text-xs leading-5 text-neutral-600'>{label}</p>
      <div className='flex overflow-hidden rounded-md border border-neutral-200 bg-neutral-50'>
        <Input
          aria-label={label}
          className='h-9 min-w-0 rounded-none border-0 bg-transparent px-3 font-mono text-[11px] text-neutral-900 shadow-none focus-visible:ring-0 dark:border-0'
          readOnly
          title={value}
          value={value}
        />
        <ClipboardCopyButtonBase
          className='flex h-9 w-11 shrink-0 items-center justify-center rounded-none border-0 border-l border-neutral-200 bg-transparent p-0 text-black shadow-none hover:bg-neutral-100'
          iconClassName='size-3.5 shrink-0'
          messages={copyMessages}
          value={value}
          variant='outline'
        />
      </div>
    </div>
  );
}

export function InstallationReportPopover({
  copyMessages,
  configReport,
  initialReport,
}: {
  copyMessages: ClipboardCopyButtonMessages;
  configReport: InstallationConfigReportItem[];
  initialReport: InstallationChecklistReport;
}) {
  const [activeTab, setActiveTab] = useState<ReportTab>('progress');
  const [open, setOpen] = useState(true);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    rect: DOMRect;
    startPosition: Position;
    startX: number;
    startY: number;
  } | null>(null);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const report = initialReport;

  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [open, router]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  useEffect(() => {
    const keepInViewport = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const padding = 8;
      const adjustmentX = Math.min(0, window.innerWidth - padding - rect.right) + Math.max(0, padding - rect.left);
      const adjustmentY = Math.min(0, window.innerHeight - padding - rect.bottom) + Math.max(0, padding - rect.top);
      if (adjustmentX || adjustmentY) {
        setPosition((current) => ({ x: current.x + adjustmentX, y: current.y + adjustmentY }));
      }
    };

    window.addEventListener('resize', keepInViewport);
    return () => window.removeEventListener('resize', keepInViewport);
  }, []);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !wrapperRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      rect: wrapperRef.current.getBoundingClientRect(),
      startPosition: position,
      startX: event.clientX,
      startY: event.clientY,
    };
    movedRef.current = false;
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) movedRef.current = true;

    const padding = 8;
    const left = Math.min(
      Math.max(drag.rect.left + deltaX, padding),
      Math.max(padding, window.innerWidth - drag.rect.width - padding),
    );
    const top = Math.min(
      Math.max(drag.rect.top + deltaY, padding),
      Math.max(padding, window.innerHeight - drag.rect.height - padding),
    );
    setPosition({
      x: drag.startPosition.x + left - drag.rect.left,
      y: drag.startPosition.y + top - drag.rect.top,
    });
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    suppressClickRef.current = movedRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toggleReport = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen((value) => !value);
  };

  return (
    <aside
      className='pointer-events-none fixed right-4 bottom-4 z-[70] sm:right-6 sm:bottom-6'
      aria-label='Setup process'
    >
      <div
        className='flex flex-col items-end'
        ref={wrapperRef}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      >
        {open ? (
          <div className='pointer-events-auto relative mb-3 flex max-h-[min(76vh,680px)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white text-black shadow-2xl'>
            <div
              className='absolute right-6 -bottom-2 size-4 rotate-45 border-r border-b border-neutral-200 bg-white'
              aria-hidden='true'
            />

            <header className='shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <h2 className='text-xl leading-tight tracking-[-0.025em] text-black'>
                    Initial Setup Process Report
                  </h2>
                  <p className='mt-1.5 text-sm leading-5 text-neutral-600'>Work with your agent to complete this list.</p>
                </div>
                <span className='shrink-0 text-2xl tracking-[-0.04em] text-black'>{report.percentage}%</span>
              </div>
              <div className='mt-4'>
                <ReadonlyPathStrip
                  copyMessages={copyMessages}
                  label='To remove, delete this file from the project source:'
                  value={removalPath}
                />
              </div>
            </header>

            <div className='grid shrink-0 grid-cols-2 border-t border-b border-neutral-200' role='tablist'>
              <button
                className='border-r border-neutral-200 px-4 py-3 text-sm text-neutral-600 aria-selected:bg-black aria-selected:text-white'
                id='installation-progress-tab'
                role='tab'
                type='button'
                aria-controls='installation-progress-panel'
                aria-selected={activeTab === 'progress'}
                onClick={() => setActiveTab('progress')}
              >
                Progress
              </button>
              <button
                className='px-4 py-3 text-sm text-neutral-600 aria-selected:bg-black aria-selected:text-white'
                id='installation-configuration-tab'
                role='tab'
                type='button'
                aria-controls='installation-configuration-panel'
                aria-selected={activeTab === 'configuration'}
                onClick={() => setActiveTab('configuration')}
              >
                Configuration
              </button>
            </div>

            {activeTab === 'progress' ? (
              <div
                className='w-full flex-1 overflow-y-auto'
                id='installation-progress-panel'
                role='tabpanel'
                aria-labelledby='installation-progress-tab'
              >
                <div className='border-b border-neutral-200 px-5 py-4 sm:px-6'>
                  <ReadonlyPathStrip copyMessages={copyMessages} label='Installation Checklist' value={checklistPath} />
                  <div
                    className='mt-4 h-2 overflow-hidden rounded-full bg-neutral-200'
                    role='progressbar'
                    aria-label='Overall setup progress'
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={report.percentage}
                  >
                    <div
                      className='h-full rounded-full bg-black transition-[width] duration-500'
                      style={{ width: `${report.percentage}%` }}
                    />
                  </div>
                  <p className='mt-2 text-xs text-neutral-600'>
                    {report.done} done · {report.skipped} skipped · {report.total - report.checked} remaining ·{' '}
                    {report.status}
                  </p>
                </div>

                <div className='w-full space-y-5 px-5 py-5 sm:px-6'>
                  {report.sections.map((section) => (
                    <section key={section.title}>
                      <div className='flex items-center justify-between gap-3'>
                        <h3 className='text-sm text-black'>{section.title}</h3>
                        <span className='shrink-0 text-[11px] text-neutral-600'>
                          {section.done} done · {section.skipped} skipped
                        </span>
                      </div>
                      <div
                        className='mt-2 h-1 overflow-hidden rounded-full bg-neutral-200'
                        role='progressbar'
                        aria-label={`${section.title} progress`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={section.percentage}
                      >
                        <div className='h-full rounded-full bg-black' style={{ width: `${section.percentage}%` }} />
                      </div>
                      <ul className='mt-2 space-y-1.5'>
                        {section.items.map((item) => (
                          <li className='flex gap-2 text-xs leading-5 text-neutral-600' key={item.label}>
                            <span
                              className={
                                item.status === 'done'
                                  ? 'mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-black text-[9px] text-white'
                                  : item.status === 'skipped'
                                    ? 'mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-neutral-200 text-[10px] text-neutral-700'
                                    : 'mt-1 size-3.5 shrink-0 rounded-[4px] border border-neutral-400 bg-white'
                              }
                              aria-hidden='true'
                            >
                              {item.status === 'done' ? '✓' : item.status === 'skipped' ? '–' : null}
                            </span>
                            <span className={item.status === 'pending' ? undefined : 'text-neutral-900'}>
                              {item.label}
                              {item.status === 'skipped' ? ' (skipped / not needed)' : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className='w-full flex-1 overflow-y-auto'
                id='installation-configuration-panel'
                role='tabpanel'
                aria-labelledby='installation-configuration-tab'
              >
                <div className='border-b border-neutral-200 px-5 py-4 sm:px-6'>
                  <ReadonlyPathStrip copyMessages={copyMessages} label='Config File' value={configPath} />
                </div>
                <ul className='w-full divide-y divide-neutral-200'>
                  {configReport.map((item) => (
                    <li className='flex min-h-14 items-center justify-between gap-4 px-5 py-3 sm:px-6' key={item.label}>
                      <span className='min-w-0 text-xs leading-5 break-all text-neutral-600'>{item.label}</span>
                      {item.booleanValue === undefined ? (
                        <span className='max-w-[45%] shrink-0 text-right text-xs leading-5 break-all text-black'>
                          {item.value}
                        </span>
                      ) : (
                        <span className='flex shrink-0 items-center gap-2 text-xs text-black'>
                          {item.value}
                          <span
                            className={
                              item.booleanValue
                                ? 'relative h-5 w-9 rounded-full bg-black'
                                : 'relative h-5 w-9 rounded-full bg-neutral-300'
                            }
                            role='switch'
                            aria-checked={item.booleanValue}
                            aria-label={`${item.label}: ${item.value}`}
                            aria-readonly='true'
                          >
                            <span
                              className={
                                item.booleanValue
                                  ? 'absolute top-0.5 left-[18px] size-4 rounded-full bg-white'
                                  : 'absolute top-0.5 left-0.5 size-4 rounded-full bg-white'
                              }
                              aria-hidden='true'
                            />
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <div className='pointer-events-auto rounded-[26px] bg-white p-2 shadow-xl'>
          <button
            type='button'
            className='block size-16 cursor-grab touch-none rounded-[20px] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 active:cursor-grabbing'
            aria-expanded={open}
            aria-label={open ? 'Move or close setup process report' : 'Move or open setup process report'}
            onClick={toggleReport}
            onPointerCancel={finishDrag}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
          >
            <InstallationAvatar className='size-full' aria-hidden='true' />
          </button>
        </div>
      </div>
    </aside>
  );
}
