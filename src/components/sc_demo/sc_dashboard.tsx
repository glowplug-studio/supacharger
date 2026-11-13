'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  CircleCheck,
  Clock3,
  MoreHorizontal,
  Search,
} from 'lucide-react';

import { Badge } from '@/supacharger/components/ui/badge';
import { Button } from '@/supacharger/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/supacharger/components/ui/card';
import { Input } from '@/supacharger/components/ui/input';
import { cn } from '@/utils/cn';

const PerformanceChart = dynamic(() => import('./sc_dashboard-chart').then((module) => module.SCDashboardChart));

type Metric = {
  detail: string;
  direction: 'down' | 'up';
  label: string;
  trend: string;
  value: string;
};

type DashboardRow = {
  item: string;
  owner: string;
  progress: string;
  status: 'Complete' | 'In progress' | 'Review';
  type: string;
};

function MetricCard({ metric }: { metric: Metric }) {
  const TrendIcon = metric.direction === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className='border-border bg-card rounded-sm shadow-none'>
      <CardHeader className='gap-4 p-5'>
        <div className='flex items-start justify-between gap-3'>
          <CardDescription className='text-muted-foreground text-sm'>{metric.label}</CardDescription>
          <Badge
            className='border-border bg-background text-foreground rounded-sm font-normal shadow-none'
            variant='outline'
          >
            <TrendIcon aria-hidden='true' className='size-3.5' />
            {metric.trend}
          </Badge>
        </div>
        <CardTitle className='text-3xl font-normal tracking-[-0.04em] tabular-nums'>{metric.value}</CardTitle>
        <p className='text-muted-foreground text-sm leading-5'>{metric.detail}</p>
      </CardHeader>
    </Card>
  );
}

function statusClasses(status: DashboardRow['status']) {
  if (status === 'Complete') return 'border-primary/20 bg-primary/10 text-primary';
  if (status === 'Review') return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return 'border-border bg-muted text-muted-foreground';
}

function ActivityTable() {
  const t = useTranslations('DashboardDemo');
  const rows = t.raw('table.rows') as DashboardRow[];

  return (
    <section className='border-border bg-card overflow-hidden rounded-sm border' id='projects'>
      <span className='block scroll-mt-20' id='inbox' />
      <span className='block scroll-mt-20' id='team' />
      <div className='border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6'>
        <div>
          <h2 className='text-xl font-medium tracking-[-0.025em]'>{t('table.title')}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{t('table.description')}</p>
        </div>
        <div className='relative w-full sm:w-64'>
          <Search
            aria-hidden='true'
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
          />
          <Input
            aria-label={t('table.searchLabel')}
            className='h-10 rounded-sm pl-9 shadow-none'
            placeholder={t('table.searchPlaceholder')}
          />
        </div>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[760px] text-left text-sm'>
          <thead className='bg-muted/60 text-muted-foreground'>
            <tr>
              <th className='px-5 py-3 font-medium lg:px-6'>{t('table.columns.item')}</th>
              <th className='px-4 py-3 font-medium'>{t('table.columns.type')}</th>
              <th className='px-4 py-3 font-medium'>{t('table.columns.status')}</th>
              <th className='px-4 py-3 font-medium'>{t('table.columns.progress')}</th>
              <th className='px-4 py-3 font-medium'>{t('table.columns.owner')}</th>
              <th className='w-14 px-4 py-3'>
                <span className='sr-only'>{t('table.columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className='border-border border-t first:border-t-0' key={row.item}>
                <td className='px-5 py-4 font-medium lg:px-6'>{row.item}</td>
                <td className='text-muted-foreground px-4 py-4'>{row.type}</td>
                <td className='px-4 py-4'>
                  <Badge
                    className={cn('rounded-sm font-normal shadow-none', statusClasses(row.status))}
                    variant='outline'
                  >
                    {row.status === 'Complete' ? (
                      <CircleCheck aria-hidden='true' className='size-3.5' />
                    ) : (
                      <Clock3 aria-hidden='true' className='size-3.5' />
                    )}
                    {row.status}
                  </Badge>
                </td>
                <td className='px-4 py-4 font-medium tabular-nums'>{row.progress}</td>
                <td className='text-muted-foreground px-4 py-4'>{row.owner}</td>
                <td className='px-4 py-4'>
                  <Button
                    aria-label={t('table.rowActions', { item: row.item })}
                    className='size-8 rounded-sm'
                    size='icon'
                    variant='ghost'
                  >
                    <MoreHorizontal aria-hidden='true' className='size-4' />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='border-border flex items-center justify-between border-t px-5 py-4 lg:px-6'>
        <p className='text-muted-foreground text-sm'>{t('table.summary', { count: rows.length })}</p>
        <Button asChild className='rounded-sm' size='sm' variant='outline'>
          <Link href='#projects'>
            {t('table.viewAll')}
            <ChevronRight aria-hidden='true' className='size-4' />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function SCDashboard() {
  const t = useTranslations('DashboardDemo');
  const metrics = t.raw('metrics') as Metric[];

  return (
    <main className='bg-background text-foreground flex-1' id='dashboard'>
      <div className='mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:gap-6 lg:px-8 lg:py-8'>
        <section>
          <div>
            <div className='text-primary mb-3 flex items-center gap-2 text-sm font-medium'>
              <Activity aria-hidden='true' className='size-4' />
              {t('sampleData')}
            </div>
            <h1 className='text-[2.25rem] leading-[1.08] font-normal tracking-[-0.04em]'>{t('title')}</h1>
            <p className='text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base'>{t('description')}</p>
          </div>
        </section>

        <section
          className='grid scroll-mt-20 gap-4 md:grid-cols-2 xl:grid-cols-4'
          aria-label={t('metricsLabel')}
          id='lifecycle'
        >
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <PerformanceChart />
        <ActivityTable />
      </div>
    </main>
  );
}
