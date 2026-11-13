import { getTranslations } from 'next-intl/server';
import { ExternalLink, FileCode2, Scale } from 'lucide-react';

import { Badge } from '@/supacharger/components/ui/badge';
import { Button } from '@/supacharger/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/supacharger/components/ui/card';

const dependencyGroups = [
  {
    key: 'mit',
    href: 'https://opensource.org/license/mit',
    packages:
      'shadcn/ui component source; Next.js, React, Radix UI, Supabase JS, Stripe, Tailwind CSS, Milkdown, Shiki, next-intl, Zod, Motion and most UI/runtime utilities',
  },
  {
    key: 'apache',
    href: 'https://www.apache.org/licenses/LICENSE-2.0',
    packages:
      'class-variance-authority; DOMPurify (also available under MPL-2.0); Sharp and SWC components where distributed',
  },
  {
    key: 'isc',
    href: 'https://opensource.org/license/isc',
    packages: 'Lucide React, @hiseb/confetti and D3 modules; Feather-derived Lucide icons also use MIT',
  },
  {
    key: 'bsd',
    href: 'https://opensource.org/license/bsd-3-clause',
    packages:
      'tslib (0BSD); entities (BSD-2-Clause); d3-ease, intl-messageformat, react-transition-group and source-map-js (BSD-3-Clause)',
  },
  {
    key: 'mpl',
    href: 'https://www.mozilla.org/MPL/2.0/',
    packages: '@vercel/analytics 1.6.1; DOMPurify alternatively offers MPL-2.0',
  },
  {
    key: 'lgpl',
    href: 'https://www.gnu.org/licenses/lgpl-3.0.html',
    packages: 'libvips binaries used by Sharp where included',
  },
  {
    key: 'ccBy',
    href: 'https://creativecommons.org/licenses/by/4.0/',
    packages: 'caniuse-lite browser compatibility data',
  },
  { key: 'unlicense', href: 'https://unlicense.org/', packages: 'email-validator 2.0.4' },
] as const;

export default async function SCLicensePage() {
  const t = await getTranslations('LicensePage');

  return (
    <div className='bg-background text-foreground min-h-screen pt-16'>
      <section className='border-border border-b'>
        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28'>
          <Badge className='bg-primary/10 text-primary rounded-lg shadow-none' variant='secondary'>
            {t('eyebrow')}
          </Badge>
          <h1 className='mt-6 max-w-4xl text-4xl font-normal tracking-[-0.04em] text-balance sm:text-5xl'>
            {t('title')}
          </h1>
          <p className='text-muted-foreground mt-6 max-w-3xl text-base leading-7'>{t('introduction')}</p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Button
              asChild
              className='bg-foreground text-background hover:bg-foreground/90 h-auto rounded-lg px-5 py-3'
            >
              <a href='https://supacharger.dev/product/pricing' rel='noopener noreferrer' target='_blank'>
                {t('nonAttributionCta')} <ExternalLink aria-hidden='true' />
              </a>
            </Button>
            <Button asChild className='h-auto rounded-lg px-5 py-3' variant='outline'>
              <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/' rel='noopener noreferrer' target='_blank'>
                {t('readLicense')} <ExternalLink aria-hidden='true' />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className='mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24'>
        <div>
          <Scale aria-hidden='true' className='text-primary size-6' />
          <h2 className='mt-5 text-3xl font-normal tracking-[-0.035em]'>{t('coreTitle')}</h2>
        </div>
        <div className='text-muted-foreground space-y-5 text-base leading-7'>
          <p>{t('coreBody')}</p>
          <p>{t('commercialBody')}</p>
          <div className='flex flex-wrap gap-x-6 gap-y-3 text-sm'>
            <a
              className='text-primary hover:underline'
              href='https://github.com/glowplug-studio/supacharger/blob/main/LICENSE.md'
              rel='noopener noreferrer'
              target='_blank'
            >
              {t('repositoryLicense')}
            </a>
          </div>
        </div>
      </section>

      <section className='border-border bg-muted/30 border-y'>
        <div className='mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
          <div className='max-w-3xl'>
            <FileCode2 aria-hidden='true' className='text-primary size-6' />
            <h2 className='mt-5 text-3xl font-normal tracking-[-0.035em]'>{t('dependenciesTitle')}</h2>
            <p className='text-muted-foreground mt-5 leading-7'>{t('dependenciesIntro')}</p>
            <p className='text-muted-foreground mt-5 leading-7'>{t('distributionBody')}</p>
          </div>
          <div className='mt-10 grid gap-4 md:grid-cols-2'>
            {dependencyGroups.map((group) => (
              <Card className='rounded-lg shadow-none' key={group.key}>
                <CardHeader>
                  <CardTitle className='text-lg'>{t(`groups.${group.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='font-mono text-xs leading-6'>{group.packages}</p>
                  <p className='text-muted-foreground mt-4 text-sm leading-6'>{t(`groups.${group.key}.description`)}</p>
                  <div className='mt-5 flex flex-wrap gap-4 text-sm'>
                    <a
                      className='text-primary inline-flex items-center gap-2 hover:underline'
                      href={group.href}
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      {t('readThirdPartyLicense', {
                        license: group.key === 'isc' ? 'ISC' : t(`groups.${group.key}.title`),
                      })}
                      <ExternalLink aria-hidden='true' className='size-4' />
                    </a>
                    {group.key === 'isc' && (
                      <a
                        className='text-primary inline-flex items-center gap-2 hover:underline'
                        href='https://opensource.org/license/mit'
                        rel='noopener noreferrer'
                        target='_blank'
                      >
                        {t('readThirdPartyLicense', { license: t('groups.mit.title') })}
                        <ExternalLink aria-hidden='true' className='size-4' />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
