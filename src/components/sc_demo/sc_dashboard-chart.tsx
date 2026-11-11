'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const chartData = [
  { date: '2026-05-26', desktop: 186, mobile: 104 },
  { date: '2026-06-02', desktop: 242, mobile: 128 },
  { date: '2026-06-09', desktop: 208, mobile: 151 },
  { date: '2026-06-16', desktop: 296, mobile: 167 },
  { date: '2026-06-23', desktop: 274, mobile: 193 },
  { date: '2026-06-30', desktop: 338, mobile: 184 },
  { date: '2026-07-07', desktop: 312, mobile: 218 },
  { date: '2026-07-14', desktop: 384, mobile: 236 },
  { date: '2026-07-21', desktop: 356, mobile: 248 },
  { date: '2026-07-28', desktop: 426, mobile: 267 },
  { date: '2026-08-04', desktop: 398, mobile: 292 },
  { date: '2026-08-11', desktop: 472, mobile: 314 },
  { date: '2026-08-18', desktop: 448, mobile: 336 },
];

export function SCDashboardChart() {
  const t = useTranslations('DashboardDemo');
  const [range, setRange] = useState('90');
  const visibleData = useMemo(() => chartData.slice(range === '7' ? -2 : range === '30' ? -5 : 0), [range]);
  const chartConfig = {
    desktop: { label: t('chart.desktop'), color: 'hsl(var(--primary))' },
    mobile: { label: t('chart.mobile'), color: 'hsl(var(--secondary))' },
  } satisfies ChartConfig;

  return (
    <Card className='border-border bg-card rounded-sm shadow-none' id='analytics'>
      <CardHeader className='gap-5 border-b p-5 sm:flex-row sm:items-start sm:justify-between lg:p-6'>
        <div>
          <CardTitle className='text-xl font-medium tracking-[-0.025em]'>{t('chart.title')}</CardTitle>
          <CardDescription className='mt-2 max-w-xl leading-6'>{t('chart.description')}</CardDescription>
        </div>
        <Tabs onValueChange={setRange} value={range}>
          <TabsList className='bg-muted h-9 rounded-sm p-1'>
            <TabsTrigger className='rounded-sm px-3 text-xs' value='90'>
              {t('ranges.days90')}
            </TabsTrigger>
            <TabsTrigger className='rounded-sm px-3 text-xs' value='30'>
              {t('ranges.days30')}
            </TabsTrigger>
            <TabsTrigger className='rounded-sm px-3 text-xs' value='7'>
              {t('ranges.days7')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className='px-2 pt-6 sm:px-5 lg:px-6'>
        <ChartContainer className='aspect-auto h-[280px] w-full' config={chartConfig}>
          <AreaChart accessibilityLayer data={visibleData} margin={{ left: 2, right: 12, top: 8 }}>
            <defs>
              <linearGradient id='scDesktopFill' x1='0' x2='0' y1='0' y2='1'>
                <stop offset='0%' stopColor='var(--color-desktop)' stopOpacity={0.34} />
                <stop offset='100%' stopColor='var(--color-desktop)' stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id='scMobileFill' x1='0' x2='0' y1='0' y2='1'>
                <stop offset='0%' stopColor='var(--color-mobile)' stopOpacity={0.3} />
                <stop offset='100%' stopColor='var(--color-mobile)' stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 5' vertical={false} />
            <XAxis
              axisLine={false}
              dataKey='date'
              minTickGap={28}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
              }
              tickLine={false}
              tickMargin={12}
            />
            <ChartTooltip content={<ChartTooltipContent indicator='line' />} cursor={false} />
            <Area
              dataKey='mobile'
              fill='url(#scMobileFill)'
              stroke='var(--color-mobile)'
              strokeWidth={2}
              type='natural'
            />
            <Area
              dataKey='desktop'
              fill='url(#scDesktopFill)'
              stroke='var(--color-desktop)'
              strokeWidth={2}
              type='natural'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
