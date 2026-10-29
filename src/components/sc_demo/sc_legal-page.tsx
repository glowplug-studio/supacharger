import { getTranslations } from 'next-intl/server';

/** Replace this disposable demonstration page with your application's legal content. */
export default async function SCLegalPage() {
  const t = await getTranslations('LegalPage');
  return (
    <main className='bg-background text-foreground min-h-screen px-4 pt-32 pb-20 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        <h1 className='text-4xl tracking-tight'>{t('title')}</h1>
        <p className='text-muted-foreground mt-5 leading-7'>{t('description')}</p>
        {(['terms', 'privacy'] as const).map((section) => (
          <section id={section} key={section} className='border-border mt-12 scroll-mt-28 border-t pt-8'>
            <h2 className='text-2xl'>{t(`${section}.title`)}</h2>
            <p className='text-muted-foreground mt-4 leading-7 whitespace-pre-line'>{t(`${section}.body`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
