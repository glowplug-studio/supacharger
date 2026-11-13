import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  BadgeDollarSign,
  Blocks,
  Building2,
  Code2,
  Database,
  ExternalLink,
  Languages,
  PanelsTopLeft,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import { Button } from '@/supacharger/components/ui/button';

import englishMessages from '../../../messages/en.json';
import packageJson from '../../../package.json';

import { SCPaywallDemoGallery } from './sc_paywall-demos';

const includedIcons = [ShieldCheck, Building2, BadgeDollarSign, Languages, PanelsTopLeft, Wrench];
const boundaryPaths = [
  'src/supacharger/  src/app/(supacharger)/  src/lib/supabase/supacharger/',
  'src/supacharger.config.ts  messages/  src/styles/project.css  src/components/sc_demo/  src/components/sc_widgets/',
  'supabase/migrations/  supabase/functions/  docs/bruno/supacharger-rpc/',
];

type WhatsIncludedContent = typeof englishMessages.MarketingFeaturePages.whatsIncluded;

function translatedText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function SCWhatsIncluded() {
  const t = useTranslations('MarketingFeaturePages');
  const translated = t.raw('whatsIncluded') as WhatsIncludedContent;
  const fallback = englishMessages.MarketingFeaturePages.whatsIncluded;
  const items = fallback.items.map((item, index) => ({
    description: translatedText(translated.items[index]?.description, item.description),
    title: translatedText(translated.items[index]?.title, item.title),
  }));
  const boundaries = fallback.boundaries.map((boundary, index) => ({
    description: translatedText(translated.boundaries[index]?.description, boundary.description),
    paths: boundaryPaths[index],
    title: translatedText(translated.boundaries[index]?.title, boundary.title),
  }));
  const stackGroups = [
    {
      packages: [
        `Next.js ${packageJson.dependencies.next}`,
        `React ${packageJson.dependencies.react}`,
        `Tailwind CSS ${packageJson.dependencies.tailwindcss}`,
        `next-intl ${packageJson.dependencies['next-intl']}`,
      ],
      title: translatedText(translated.stackGroups[0]?.title, fallback.stackGroups[0].title),
    },
    {
      packages: [
        `Supabase JS ${packageJson.dependencies['@supabase/supabase-js']}`,
        `Supabase SSR ${packageJson.dependencies['@supabase/ssr']}`,
        `Stripe ${packageJson.dependencies.stripe}`,
        `Zod ${packageJson.dependencies.zod}`,
      ],
      title: translatedText(translated.stackGroups[1]?.title, fallback.stackGroups[1].title),
    },
    {
      packages: [
        `Motion ${packageJson.dependencies.motion}`,
        `Lucide React ${packageJson.dependencies['lucide-react']}`,
        `React Hook Form ${packageJson.dependencies['react-hook-form']}`,
        `Recharts ${packageJson.dependencies.recharts}`,
      ],
      title: translatedText(translated.stackGroups[2]?.title, fallback.stackGroups[2].title),
    },
    {
      packages: [
        `Milkdown Crepe ${packageJson.dependencies['@milkdown/crepe']}`,
        `Shiki ${packageJson.devDependencies.shiki}`,
        `TypeScript ${packageJson.devDependencies.typescript}`,
        `SVGR ${packageJson.devDependencies['@svgr/webpack']}`,
      ],
      title: translatedText(translated.stackGroups[3]?.title, fallback.stackGroups[3].title),
    },
  ];

  return (
    <div className='bg-background text-foreground min-h-screen pt-16'>
      <section className='border-border border-b'>
        <div className='mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28'>
          <h1 className='max-w-4xl text-4xl font-normal tracking-[-0.04em] text-balance sm:text-5xl'>
            {translatedText(translated.title, fallback.title)}
          </h1>
          <p className='text-muted-foreground mt-6 max-w-3xl text-base leading-7'>
            {translatedText(translated.description, fallback.description)}
          </p>
        </div>
      </section>

      <section className='border-border bg-muted/30 border-y py-16 lg:py-24'>
        <div className='mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20 lg:px-8'>
          <div>
            <h2 className='max-w-sm text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
              {translatedText(translated.capabilitiesTitle, fallback.capabilitiesTitle)}
            </h2>
            <p className='text-muted-foreground mt-5 max-w-sm text-sm leading-6'>
              {translatedText(translated.capabilitiesDescription, fallback.capabilitiesDescription)}
            </p>
            <Button asChild className='mt-7 h-auto rounded-lg px-5 py-3' variant='outline'>
              <a href='https://supacharger.dev/product/features' rel='noreferrer' target='_blank'>
                {translatedText(translated.fullFeatureSet, fallback.fullFeatureSet)}
                <ExternalLink aria-hidden='true' />
              </a>
            </Button>
          </div>

          <div className='grid gap-x-10 gap-y-10 md:grid-cols-2'>
            {items.map((item, index) => {
              const Icon = includedIcons[index];

              return (
                <article className='border-border border-t pt-5' key={item.title}>
                  <div className='flex items-center gap-3'>
                    <Icon aria-hidden='true' className='text-primary size-5' />
                    <h3 className='font-medium'>{item.title}</h3>
                  </div>
                  <p className='text-muted-foreground mt-3 text-sm leading-6'>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className='py-16 lg:py-24'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
          <h2 className='max-w-2xl text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
            {translatedText(translated.boundariesTitle, fallback.boundariesTitle)}
          </h2>
          <p className='text-muted-foreground mt-5 max-w-2xl text-sm leading-6'>
            {translatedText(translated.boundariesDescription, fallback.boundariesDescription)}
          </p>

          <div className='mt-10 grid gap-4 lg:grid-cols-2'>
            {boundaries.map((boundary, index) => {
              const Icon = [Blocks, Code2, Database][index];

              return (
                <article
                  className={`border-border rounded-lg border p-6 sm:p-8 ${index === 0 ? 'bg-primary/5 lg:col-span-2' : 'bg-card'}`}
                  key={boundary.title}
                >
                  <div className={index === 0 ? 'grid gap-6 lg:grid-cols-[0.8fr_1.2fr]' : ''}>
                    <div>
                      <Icon aria-hidden='true' className='text-primary size-5' />
                      <h3 className='mt-5 text-xl font-medium tracking-tight'>{boundary.title}</h3>
                      <p className='text-muted-foreground mt-3 max-w-xl text-sm leading-6'>{boundary.description}</p>
                    </div>
                    <code className='border-border bg-background mt-6 block overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-6 lg:mt-0'>
                      {boundary.paths}
                    </code>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className='border-border border-y py-16 lg:py-24'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-3'>
            <Database aria-hidden='true' className='text-primary size-5' />
            <h2 className='text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
              {translatedText(translated.stackTitle, fallback.stackTitle)}
            </h2>
          </div>
          <p className='text-muted-foreground mt-5 max-w-2xl text-sm leading-6'>
            {translatedText(translated.stackDescription, fallback.stackDescription)}
          </p>

          <div className='mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4'>
            {stackGroups.map((group) => (
              <div className='border-primary border-l-2 pl-5' key={group.title}>
                <h3 className='font-medium'>{group.title}</h3>
                <ul className='text-muted-foreground mt-4 space-y-2 font-mono text-xs leading-5' role='list'>
                  {group.packages.map((packageName) => (
                    <li key={packageName}>{packageName}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function SCPaywallDemos() {
  const t = useTranslations('MarketingFeaturePages');
  const content = t.raw('paywallDemos') as {
    description: string;
    heroImageAlt: string;
    title: string;
  };

  return (
    <div className='bg-background text-foreground min-h-screen pt-16'>
      <section className='border-border border-b'>
        <div className='mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28'>
          <div>
            <h1 className='max-w-4xl text-4xl font-normal tracking-[-0.04em] text-balance sm:text-5xl'>
              {content.title}
            </h1>
            <p className='text-muted-foreground mt-6 max-w-3xl text-base leading-7'>{content.description}</p>
          </div>
          <div className='border-border overflow-hidden rounded-lg border'>
            <Image
              alt={content.heroImageAlt || englishMessages.MarketingFeaturePages.paywallDemos.heroImageAlt}
              className='aspect-[16/10] h-auto w-full rounded-lg object-cover object-left-top'
              height={695}
              priority
              sizes='(max-width: 1024px) 100vw, 58vw'
              src='/images/sc_demo/sc-marketing-chat-workspace.webp'
              width={1080}
            />
          </div>
        </div>
      </section>

      <SCPaywallDemoGallery />
    </div>
  );
}
