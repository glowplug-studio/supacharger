'use client';

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import InstallationAvatar from '@/supacharger/assets/svgr/brand/supacharger-installation-avatar.svg';
import {
  ClipboardCopyButtonBase,
  type ClipboardCopyButtonMessages,
} from '@/supacharger/components/buttons/clipboard-copy-button';

import type { InstallationChecklistReport } from '../_lib/checklist';
import type { InstallationConfigReportItem } from '../_lib/config-report';

type ReportTab = 'configuration' | 'progress';
type Position = { x: number; y: number };

const removalPath = 'src/app/(project)/(extensions)/(sc_extensions)/(installation-report)';

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
          <div className='pointer-events-auto relative mb-3 flex max-h-[min(76vh,680px)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-white text-[#193832] shadow-[0_24px_70px_rgba(20,35,29,0.18)]'>
            <div
              className='absolute right-6 -bottom-2 size-4 rotate-45 border-r border-b border-black/10 bg-white'
              aria-hidden='true'
            />

            <header className='shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <h2 className='text-xl leading-tight tracking-[-0.025em] text-[#193832]'>Setup Process Report</h2>
                  <p className='mt-2 text-sm leading-5 text-[#52665b]'>
                    This report shows the status of the setup process.
                  </p>
                </div>
                <span className='shrink-0 text-2xl tracking-[-0.04em] text-[#26745a]'>{report.percentage}%</span>
              </div>
              <p className='mt-3 text-xs leading-5 text-[#52665b]'>
                To remove, delete{' '}
                <ClipboardCopyButtonBase
                  className='inline-flex h-auto max-w-full overflow-hidden rounded-md border-[#cfdbd1] bg-[#f4f7f4] px-2 py-1 align-middle text-[#264d42] shadow-none hover:bg-[#eaf0eb]'
                  iconClassName='size-3.5 shrink-0'
                  messages={copyMessages}
                  value={removalPath}
                  variant='outline'
                >
                  <code className='block min-w-0 truncate text-[11px]'>{removalPath}</code>
                </ClipboardCopyButtonBase>{' '}
                from the project source.
              </p>
            </header>

            <div className='grid shrink-0 grid-cols-2 border-t border-b border-[#dce4de]' role='tablist'>
              <button
                className='border-r border-[#dce4de] px-4 py-3 text-sm text-[#52665b] aria-selected:bg-[#eef3ef] aria-selected:text-[#193832]'
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
                className='px-4 py-3 text-sm text-[#52665b] aria-selected:bg-[#eef3ef] aria-selected:text-[#193832]'
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
                <div className='border-b border-[#dce4de] px-5 py-4 sm:px-6'>
                  <div
                    className='h-2 overflow-hidden rounded-full bg-[#dce4de]'
                    role='progressbar'
                    aria-label='Overall setup progress'
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={report.percentage}
                  >
                    <div
                      className='h-full rounded-full bg-[#26745a] transition-[width] duration-500'
                      style={{ width: `${report.percentage}%` }}
                    />
                  </div>
                  <p className='mt-2 text-xs text-[#52665b]'>
                    {report.checked}/{report.total} tasks resolved · {report.status}
                  </p>
                </div>

                <div className='w-full space-y-5 px-5 py-5 sm:px-6'>
                  {report.sections.map((section) => (
                    <section key={section.title}>
                      <div className='flex items-center justify-between gap-3'>
                        <h3 className='text-sm text-[#193832]'>{section.title}</h3>
                        <span className='shrink-0 text-[11px] text-[#52665b]'>
                          {section.checked}/{section.total}
                        </span>
                      </div>
                      <div
                        className='mt-2 h-1 overflow-hidden rounded-full bg-[#e7ece8]'
                        role='progressbar'
                        aria-label={`${section.title} progress`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={section.percentage}
                      >
                        <div className='h-full rounded-full bg-[#26745a]' style={{ width: `${section.percentage}%` }} />
                      </div>
                      <ul className='mt-2 space-y-1.5'>
                        {section.items.map((item) => (
                          <li className='flex gap-2 text-xs leading-5 text-[#52665b]' key={item.label}>
                            <span
                              className={
                                item.status === 'done'
                                  ? 'mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#20543e] text-[9px] text-white'
                                  : item.status === 'skipped'
                                    ? 'mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#dce4de] text-[10px] text-[#52665b]'
                                    : 'mt-1 size-3.5 shrink-0 rounded-[4px] border border-[#b9c8bd] bg-white'
                              }
                              aria-hidden='true'
                            >
                              {item.status === 'done' ? '✓' : item.status === 'skipped' ? '–' : null}
                            </span>
                            <span className={item.status === 'pending' ? undefined : 'text-[#264d42]'}>
                              {item.label}
                              {item.status === 'skipped' ? ' (skipped)' : null}
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
                <ul className='w-full divide-y divide-[#e7ece8]'>
                  {configReport.map((item) => (
                    <li className='flex min-h-14 items-center justify-between gap-4 px-5 py-3 sm:px-6' key={item.label}>
                      <span className='min-w-0 text-xs leading-5 break-all text-[#52665b]'>{item.label}</span>
                      {item.booleanValue === undefined ? (
                        <span className='max-w-[45%] shrink-0 text-right text-xs leading-5 break-all text-[#193832]'>
                          {item.value}
                        </span>
                      ) : (
                        <span className='flex shrink-0 items-center gap-2 text-xs text-[#193832]'>
                          {item.value}
                          <span
                            className={
                              item.booleanValue
                                ? 'relative h-5 w-9 rounded-full bg-[#26745a]'
                                : 'relative h-5 w-9 rounded-full bg-[#cbd5ce]'
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

        <div className='pointer-events-auto rounded-[26px] bg-white p-2 shadow-[0_14px_36px_rgba(20,35,29,0.22)]'>
          <button
            type='button'
            className='block size-16 cursor-grab touch-none rounded-[20px] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#26745a] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 active:cursor-grabbing'
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
