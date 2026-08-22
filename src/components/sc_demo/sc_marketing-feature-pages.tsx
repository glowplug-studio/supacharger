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
  FileCode2,
  Languages,
  PanelsTopLeft,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import englishMessages from '../../../messages/en.json';
import packageJson from '../../../package.json';

import { SCCopyCodeButton } from './sc_copy-code-button';
import { SCPaywallDemoGallery } from './sc_paywall-demos';

const includedIcons = [ShieldCheck, Building2, BadgeDollarSign, Languages, PanelsTopLeft, Wrench];
const boundaryPaths = [
  'src/supacharger/  src/app/(supacharger)/  src/lib/supabase/supacharger/',
  'src/supacharger.config.ts  messages/  src/styles/project.css  src/components/sc_demo/',
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
  const packageCode = JSON.stringify(packageJson, null, 2);
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
  ];

  return (
    <div className='bg-background text-foreground'>
      <section className='px-4 pt-24 pb-16 sm:px-6 lg:px-8 lg:pb-24'>
        <div className='mx-auto max-w-7xl'>
          <h1 className='max-w-3xl text-4xl leading-[1.08] font-normal tracking-[-0.04em] text-balance sm:text-6xl'>
            {translatedText(translated.title, fallback.title)}
          </h1>
          <p className='text-muted-foreground mt-6 max-w-2xl text-base leading-7'>
            {translatedText(translated.description, fallback.description)}
          </p>
        </div>
      </section>

      <section className='border-border bg-muted/30 border-y px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
        <div className='mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20'>
          <div>
            <h2 className='max-w-sm text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
              {translatedText(translated.capabilitiesTitle, fallback.capabilitiesTitle)}
            </h2>
            <p className='text-muted-foreground mt-5 max-w-sm text-sm leading-6'>
              {translatedText(translated.capabilitiesDescription, fallback.capabilitiesDescription)}
            </p>
            <Button asChild className='mt-7 h-auto rounded-sm px-5 py-3' variant='outline'>
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

      <section className='px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
        <div className='mx-auto max-w-7xl'>
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
                  className={`border-border rounded-sm border p-6 sm:p-8 ${index === 0 ? 'bg-primary/5 lg:col-span-2' : 'bg-card'}`}
                  key={boundary.title}
                >
                  <div className={index === 0 ? 'grid gap-6 lg:grid-cols-[0.8fr_1.2fr]' : ''}>
                    <div>
                      <Icon aria-hidden='true' className='text-primary size-5' />
                      <h3 className='mt-5 text-xl font-medium tracking-tight'>{boundary.title}</h3>
                      <p className='text-muted-foreground mt-3 max-w-xl text-sm leading-6'>{boundary.description}</p>
                    </div>
                    <code className='border-border bg-background mt-6 block overflow-x-auto rounded-sm border p-4 font-mono text-xs leading-6 lg:mt-0'>
                      {boundary.paths}
                    </code>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className='border-border border-y px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex items-center gap-3'>
            <Database aria-hidden='true' className='text-primary size-5' />
            <h2 className='text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
              {translatedText(translated.stackTitle, fallback.stackTitle)}
            </h2>
          </div>
          <p className='text-muted-foreground mt-5 max-w-2xl text-sm leading-6'>
            {translatedText(translated.stackDescription, fallback.stackDescription)}
          </p>

          <div className='mt-10 grid gap-10 md:grid-cols-3'>
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

      <section className='px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
            <div>
              <h2 className='max-w-2xl text-3xl font-normal tracking-[-0.035em] text-balance sm:text-4xl'>
                {translatedText(translated.packageTitle, fallback.packageTitle)}
              </h2>
              <p className='text-muted-foreground mt-5 max-w-2xl text-sm leading-6'>
                {translatedText(translated.packageDescription, fallback.packageDescription)}
              </p>
            </div>
            <SCCopyCodeButton
              code={packageCode}
              copiedLabel={translatedText(translated.copiedPackage, fallback.copiedPackage)}
              copyLabel={translatedText(translated.copyPackage, fallback.copyPackage)}
              errorLabel={translatedText(translated.copyFailed, fallback.copyFailed)}
            />
          </div>

          <div className='border-border bg-card mt-8 overflow-hidden rounded-sm border'>
            <div className='border-border text-muted-foreground flex items-center gap-2 border-b px-4 py-3 font-mono text-xs'>
              <FileCode2 aria-hidden='true' className='size-4' />
              {translatedText(translated.packageFile, fallback.packageFile)}
            </div>
            <pre className='max-h-[42rem] overflow-auto p-5 text-xs leading-6 sm:p-7'>
              <code>{packageCode}</code>
            </pre>
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
    <div className='bg-background text-foreground'>
      <section className='px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-24'>
        <div className='mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]'>
          <div>
            <h1 className='max-w-3xl text-4xl leading-[1.08] font-normal tracking-[-0.04em] text-balance sm:text-6xl'>
              {content.title}
            </h1>
            <p className='text-muted-foreground mt-6 max-w-xl text-base leading-7'>{content.description}</p>
          </div>
          <div className='border-border bg-card overflow-hidden rounded-sm border p-2 sm:p-3'>
            <Image
              alt={content.heroImageAlt || englishMessages.MarketingFeaturePages.paywallDemos.heroImageAlt}
              className='aspect-[16/10] h-auto w-full rounded-sm object-cover object-left-top'
              height={1006}
              priority
              sizes='(max-width: 1024px) 100vw, 58vw'
              src='/images/sc_demo/sc-marketing-chat-workspace.png'
              width={1564}
            />
          </div>
        </div>
      </section>

      <SCPaywallDemoGallery modalExampleFallback={englishMessages.MarketingFeaturePages.paywallDemos.modalExample} />
    </div>
  );
}
