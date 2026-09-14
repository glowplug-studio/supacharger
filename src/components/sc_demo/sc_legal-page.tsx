'use client';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LegalSection = { body: string; title: string };

export default function SCLegalPage() {
  const t = useTranslations('LegalPage');
  const renderSections = (sections: LegalSection[]) => sections.map((section) => (
    <section className='border-border border-t py-7 first:border-t-0 first:pt-0' key={section.title}>
      <h2 className='text-xl font-medium'>{section.title}</h2>
      <p className='text-muted-foreground mt-3 whitespace-pre-line text-sm leading-7'>{section.body}</p>
    </section>
  ));

  return <main className='bg-background text-foreground min-h-screen px-4 pt-32 pb-20 sm:px-6 lg:px-8'>
    <div className='mx-auto max-w-5xl'>
      <p className='text-primary text-sm font-semibold tracking-wide uppercase'>{t('eyebrow')}</p>
      <h1 className='mt-4 text-4xl font-normal tracking-[-0.04em] sm:text-6xl'>{t('title')}</h1>
      <p className='text-muted-foreground mt-5 max-w-2xl leading-7'>{t('description')}</p>
      <Tabs className='mt-12' defaultValue='terms'>
        <TabsList className='h-auto w-full justify-start overflow-x-auto rounded-lg p-1'>
          <TabsTrigger className='rounded-lg px-4 py-2.5' value='terms'>{t('tabs.terms')}</TabsTrigger>
          <TabsTrigger className='rounded-lg px-4 py-2.5' value='privacy'>{t('tabs.privacy')}</TabsTrigger>
          <TabsTrigger className='rounded-lg px-4 py-2.5' value='cookies'>{t('tabs.cookies')}</TabsTrigger>
        </TabsList>
        {(['terms', 'privacy', 'cookies'] as const).map((key) => <TabsContent className='mt-8' key={key} value={key}>
          <h2 className='text-3xl font-normal tracking-[-0.03em]'>{t(`${key}.title`)}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{t('lastUpdated')}</p>
          <div className='mt-8'>{renderSections(t.raw(`${key}.sections`) as LegalSection[])}</div>
        </TabsContent>)}
      </Tabs>
    </div>
  </main>;
}
