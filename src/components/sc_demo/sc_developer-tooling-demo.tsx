import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { codeToHtml } from 'shiki';

import packageJson from '../../../package.json';

import { SCMilkdownEditor } from './sc_milkdown-editor';
import { SCShikiCodePreview } from './sc_shiki-code-preview';

const shikiThemes = [
  { id: 'monokai', label: 'Monokai' },
  { id: 'material-theme-darker', label: 'Material Darker' },
  { id: 'vesper', label: 'Vesper' },
  { id: 'github-dark', label: 'GitHub Dark' },
] as const;

const packageCode = JSON.stringify(packageJson, null, 2);
const highlightedThemesPromise = Promise.all(
  shikiThemes.map(async (theme) => ({
    ...theme,
    html: await codeToHtml(packageCode, { lang: 'json', theme: theme.id }),
  })),
);

export async function SCDeveloperToolingDemo() {
  const t = await getTranslations('MarketingFeaturePages.coreWidgetDemos');
  const highlightedThemes = await highlightedThemesPromise;

  return (
    <>
      <section className='bg-muted/20 py-14 lg:py-20'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
          <h2 className='max-w-2xl text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
            {t('developerToolsTitle')}
          </h2>
          <p className='text-muted-foreground mt-5 max-w-2xl text-sm leading-6'>{t('developerToolsDescription')}</p>

          <div className='mt-10 space-y-8'>
            <SCShikiCodePreview
              code={packageCode}
              copiedLabel={t('copiedPackage')}
              copyLabel={t('copyPackage')}
              description={t('shikiDescription')}
              errorLabel={t('copyFailed')}
              selectLabel={t('shikiThemeLabel')}
              themes={highlightedThemes}
              title={t('shikiTitle')}
            />

            <article className='border-border bg-card overflow-hidden rounded-xl border'>
              <header className='border-border/70 flex min-h-20 items-center border-b px-5 py-5 sm:px-6'>
                <div>
                  <h3 className='text-lg font-medium tracking-tight'>{t('milkdownTitle')}</h3>
                  <p className='text-muted-foreground mt-1 text-sm leading-6'>{t('milkdownDescription')}</p>
                </div>
              </header>
              <SCMilkdownEditor
                errorLabel={t('milkdownError')}
                label={t('milkdownEditorLabel')}
                loadingLabel={t('milkdownLoading')}
              />
            </article>
          </div>
        </div>
      </section>

      <section className='border-border text-foreground border-t'>
        <div className='mx-auto w-full max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20'>
          <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
            <div className='max-w-2xl'>
              <h2 className='text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>{t('shadcnTitle')}</h2>
              <p className='text-muted-foreground mt-5 max-w-xl text-sm leading-6'>{t('shadcnDescription')}</p>
            </div>
            <a
              className='shrink-0 text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4'
              href='https://ui.shadcn.com/docs/components'
              rel='noreferrer'
              target='_blank'
            >
              {t('shadcnLink')}
            </a>
          </div>

          <div className='mt-10 overflow-hidden lg:w-1/2'>
            <Image
              alt={t('shadcnImageAlt')}
              className='h-auto w-full dark:hidden'
              height={347}
              loading='lazy'
              sizes='(min-width: 1280px) 608px, (min-width: 1024px) 50vw, 100vw'
              src='/images/sc_demo/shad-light.webp'
              width={1003}
            />
            <Image
              alt={t('shadcnImageAlt')}
              className='hidden h-auto w-full dark:block'
              height={347}
              loading='lazy'
              sizes='(min-width: 1280px) 608px, (min-width: 1024px) 50vw, 100vw'
              src='/images/sc_demo/shad-dark.webp'
              width={1002}
            />
          </div>
        </div>
      </section>
    </>
  );
}
