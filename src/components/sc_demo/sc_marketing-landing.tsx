import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CircleCheckBig,
  LockKeyhole,
  MapPin,
  MessageSquareMore,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DiscordLogo from '@/supacharger/assets/svgr/auth-providers/discord-icon.svg';
import FigmaLogo from '@/supacharger/assets/svgr/auth-providers/figma-icon.svg';
import GitHubLogo from '@/supacharger/assets/svgr/auth-providers/github-icon.svg';
import GoogleLogo from '@/supacharger/assets/svgr/auth-providers/google-icon.svg';
import MicrosoftLogo from '@/supacharger/assets/svgr/auth-providers/microsoft-icon.svg';
import SlackLogo from '@/supacharger/assets/svgr/auth-providers/slack-icon.svg';
import { cn } from '@/utils/cn';

import SCLogoMarquee from './sc_logo_marquee';

type DemoLogo = ComponentType<SVGProps<SVGSVGElement>>;

const marketingButtonClassName = 'h-auto rounded-sm px-5 py-3 text-sm';

const communityPillars = [
  {
    icon: MessageSquareMore,
  },
  {
    icon: UsersRound,
  },
  {
    icon: CalendarDays,
  },
  {
    icon: ShieldCheck,
  },
];

const platformFeatures = [
  {
    id: 'discovery',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 571,
    imageSrc: '/images/sc_demo/sc-marketing-mobile-onboarding.webp',
    imageWidth: 960,
  },
  {
    id: 'workspace',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 695,
    imageSrc: '/images/sc_demo/sc-marketing-chat-workspace.webp',
    imageWidth: 1080,
  },
  {
    id: 'participation',
    imageClassName: 'object-cover object-center',
    imageHeight: 450,
    imageSrc: '/images/sc_demo/sc-marketing-community-night.webp',
    imageWidth: 800,
  },
];

const connectedExperiences = [
  {
    href: '#overview',
    imageClassName: 'object-cover object-top',
    imageHeight: 900,
    imageSrc: '/images/sc_demo/sc-marketing-app-multi.webp',
    imageWidth: 900,
  },
  {
    href: '#benefits',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 579,
    imageSrc: '/images/sc_demo/sc-marketing-profile-discovery.webp',
    imageWidth: 900,
  },
  {
    href: '/account/create',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 536,
    imageSrc: '/images/sc_demo/sc-marketing-mobile-community.webp',
    imageWidth: 900,
  },
];

const integrations: { Logo: DemoLogo; name: string }[] = [
  { Logo: GoogleLogo, name: 'Google' },
  { Logo: SlackLogo, name: 'Slack' },
  { Logo: MicrosoftLogo, name: 'Microsoft' },
  { Logo: DiscordLogo, name: 'Discord' },
  { Logo: GitHubLogo, name: 'GitHub' },
  { Logo: FigmaLogo, name: 'Figma' },
];

const benefits = [
  { icon: MapPin },
  { icon: SlidersHorizontal },
  { icon: Search },
  { icon: BellRing },
  { icon: LockKeyhole },
  { icon: Building2 },
];

const testimonials = [
  { avatarSrc: '/images/sc_demo/sc-testimonial-maya.webp' },
  { avatarSrc: '/images/sc_demo/sc-testimonial-luca.webp' },
  { avatarSrc: '/images/sc_demo/sc-testimonial-sora.webp' },
  { avatarSrc: '/images/sc_demo/sc-testimonial-tomasz.webp' },
  { avatarSrc: '/images/sc_demo/sc-testimonial-elias.webp' },
  { avatarSrc: '/images/sc_demo/sc-testimonial-camille.webp' },
];

const plans = [{ popular: false }, { popular: true }, { popular: false }];

interface SCSectionHeadingProps {
  description: string;
  title: string;
}

function SCSectionHeading({ description, title }: SCSectionHeadingProps) {
  return (
    <div className='max-w-2xl'>
      <h2 className='text-foreground text-[2.375rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance'>
        {title}
      </h2>
      <p className='text-muted-foreground mt-5 max-w-[60ch] text-base leading-7'>{description}</p>
    </div>
  );
}

export default function SCMarketingLanding() {
  const t = useTranslations('MarketingLanding');
  const localisedPillars = communityPillars.map((item, index) => ({ ...item, ...t.raw(`communityPillars.${index}`) }));
  const localisedFeatures = platformFeatures.map((item, index) => ({ ...item, ...t.raw(`platformFeatures.${index}`) }));
  const localisedExperiences = connectedExperiences.map((item, index) => ({
    ...item,
    ...t.raw(`connectedExperiences.${index}`),
  }));
  const localisedBenefits = benefits.map((item, index) => ({ ...item, ...t.raw(`benefits.${index}`) }));
  const localisedTestimonials = testimonials.map((item, index) => ({ ...item, ...t.raw(`testimonials.${index}`) }));
  const localisedPlans = plans.map((item, index) => ({ ...item, ...t.raw(`plans.${index}`) }));
  const faqs = t.raw('faqs') as { answer: string; question: string }[];
  // Marketing shape system: 4px surfaces and controls, with circular avatars preserved.
  return (
    <main className='bg-background text-foreground overflow-hidden'>
      <section className='relative min-h-[100dvh] scroll-mt-16 pt-16' id='hero'>
        <div className='absolute inset-x-0 top-16 h-[560px] bg-[radial-gradient(circle_at_50%_18%,rgba(0,163,80,0.12),transparent_58%)]' />
        <div className='relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-24'>
          <div className='sc-home-enter max-w-4xl'>
            <h1 className='max-w-4xl text-[2.75rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance sm:text-5xl'>
              {t('hero.title')}
            </h1>
            <p className='text-muted-foreground mt-6 max-w-2xl text-base leading-7'>{t('hero.description')}</p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Button
                asChild
                className={cn(
                  marketingButtonClassName,
                  'bg-foreground text-background hover:bg-foreground/90 shadow-none active:scale-[0.98]',
                )}
              >
                <Link href='/account/create'>{t('createAccount')}</Link>
              </Button>
              <Button
                asChild
                className={cn(
                  marketingButtonClassName,
                  'border-border bg-foreground/5 text-foreground hover:bg-accent hover:text-foreground shadow-none active:scale-[0.98]',
                )}
                variant='outline'
              >
                <Link href='/features/whats-included'>
                  {t('exploreFeatures')}
                  <ArrowRight aria-hidden='true' />
                </Link>
              </Button>
            </div>
          </div>

          <SCLogoMarquee label={t('trustedOrganisations')} />

          <div className='sc-home-enter-delayed border-border bg-card shadow-foreground/20 mt-14 overflow-hidden rounded-sm border p-2 shadow-2xl sm:p-4'>
            <Image
              alt={t('images.messagingWorkspace')}
              className='h-auto w-full rounded-sm'
              height={960}
              priority
              sizes='(max-width: 1280px) 100vw, 1216px'
              src='/images/sc_demo/sc-marketing-desktop-hero.webp'
              width={1280}
            />
          </div>

          <div className='border-border mt-8 grid border-y sm:grid-cols-2 lg:grid-cols-4'>
            {localisedPillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <div
                  className={`py-6 sm:px-6 ${
                    index > 0 ? 'border-border border-t sm:border-t-0' : ''
                  } ${index % 2 === 1 ? 'sm:border-l' : ''} ${index > 1 ? 'lg:border-l' : ''}`}
                  key={pillar.title}
                >
                  <Icon aria-hidden='true' className='text-primary size-5' />
                  <h2 className='mt-4 text-sm font-medium'>{pillar.title}</h2>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='overview'>
        <div className='mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8'>
          <SCSectionHeading description={t('overview.description')} title={t('overview.title')} />
          <div className='border-border bg-card overflow-hidden rounded-sm border'>
            <Image
              alt={t('images.mobileScreens')}
              className='h-full w-full object-cover transition-transform duration-500 hover:scale-[1.015]'
              height={600}
              loading='eager'
              sizes='(max-width: 1024px) 100vw, 58vw'
              src='/images/sc_demo/sc-marketing-hero.webp'
              width={900}
            />
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='features'>
        <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='pointer-events-none absolute top-0 right-8 h-72 w-2/3 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [mask-image:linear-gradient(to_left,black,transparent)] [background-size:16px_16px]' />
          <SCSectionHeading description={t('features.description')} title={t('features.title')} />

          <div className='relative mt-12 grid gap-5 md:grid-cols-3'>
            {localisedFeatures.map((feature) => (
              <Card
                className='group border-border bg-card text-foreground overflow-hidden rounded-sm py-0 shadow-none'
                key={feature.id}
              >
                <div className='bg-primary/10 aspect-[4/3] overflow-hidden'>
                  <Image
                    alt={feature.imageAlt}
                    className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.02] ${feature.imageClassName}`}
                    height={feature.imageHeight}
                    sizes='(max-width: 768px) 100vw, 33vw'
                    src={feature.imageSrc}
                    width={feature.imageWidth}
                  />
                </div>
                <CardHeader className='bg-card gap-4 px-6 pt-8 pb-8 sm:px-7 sm:pt-9'>
                  <CardTitle className='text-2xl font-normal tracking-[-0.03em]'>{feature.title}</CardTitle>
                  <CardDescription className='text-muted-foreground text-base leading-7'>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='integrations'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading description={t('integrations.description')} title={t('integrations.title')} />
          <div className='border-border bg-foreground/10 mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border sm:grid-cols-3 lg:grid-cols-6'>
            {integrations.map(({ Logo, name }) => (
              <div
                className='bg-muted hover:bg-accent flex min-h-32 items-center justify-center p-6 transition-colors'
                key={name}
              >
                <Logo aria-label={name} className='h-9 w-9' role='img' />
                <span className='sr-only'>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='benefits'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading description={t('benefitsSection.description')} title={t('benefitsSection.title')} />

          <div className='mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-stretch'>
            <div className='grid gap-x-8 sm:grid-cols-2'>
              {localisedBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div className='border-border border-t py-6' key={benefit.title}>
                    <Icon aria-hidden='true' className='text-primary size-5' />
                    <h3 className='mt-4 text-base font-medium'>{benefit.title}</h3>
                    <p className='text-muted-foreground mt-2 text-sm leading-6'>{benefit.description}</p>
                  </div>
                );
              })}
            </div>
            <div className='border-border bg-card min-h-[420px] overflow-hidden rounded-sm border'>
              <Image
                alt={t('images.neighboursAtNight')}
                className='h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]'
                height={507}
                sizes='(max-width: 1024px) 100vw, 52vw'
                src='/images/sc_demo/sc-marketing-community-night-backup.webp'
                width={900}
              />
            </div>
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='about'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading description={t('experiences.description')} title={t('experiences.title')} />

          <div className='mt-16 space-y-16 lg:space-y-24'>
            {localisedExperiences.map((experience, index) => (
              <div className='grid items-center gap-9 md:grid-cols-2 lg:gap-16' key={experience.title}>
                <div
                  className={`border-border bg-card overflow-hidden rounded-sm border ${
                    index % 2 === 1 ? 'md:order-2' : ''
                  }`}
                >
                  <Image
                    alt={experience.imageAlt}
                    className={`aspect-[4/3] h-full w-full transition-transform duration-500 hover:scale-[1.015] ${experience.imageClassName}`}
                    height={experience.imageHeight}
                    sizes='(max-width: 768px) 100vw, 50vw'
                    src={experience.imageSrc}
                    width={experience.imageWidth}
                  />
                </div>
                <div className={`max-w-lg ${index % 2 === 1 ? 'md:justify-self-start' : 'md:justify-self-end'}`}>
                  <h3 className='text-[2rem] leading-[1.12] font-normal tracking-[-0.035em] text-balance sm:text-[2.375rem]'>
                    {experience.title}
                  </h3>
                  <p className='text-muted-foreground mt-5 text-base leading-7'>{experience.description}</p>
                  <Button
                    asChild
                    className={cn(
                      marketingButtonClassName,
                      'bg-foreground text-background hover:bg-foreground/90 mt-7 active:scale-[0.98]',
                    )}
                  >
                    <Link href={experience.href}>{experience.cta}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='reviews'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading description={t('reviewsSection.description')} title={t('reviewsSection.title')} />

          <div className='mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {localisedTestimonials.map((testimonial) => (
              <Card className='border-border bg-muted text-foreground rounded-sm shadow-none' key={testimonial.name}>
                <CardContent className='flex min-h-[320px] flex-col p-7 sm:p-8'>
                  <p className='text-foreground/80 text-lg leading-8 tracking-[-0.02em]'>“{testimonial.quote}”</p>
                  <div className='mt-auto pt-8'>
                    <Separator className='bg-foreground/10 mb-7' />
                    <div className='flex items-center gap-4'>
                      <Image
                        alt={testimonial.avatarAlt}
                        className='size-14 shrink-0 rounded-full object-cover'
                        height={56}
                        src={testimonial.avatarSrc}
                        width={56}
                      />
                      <div className='min-w-0'>
                        <p className='text-foreground text-base font-medium'>{testimonial.name}</p>
                        <p className='text-muted-foreground mt-1 text-sm leading-5'>
                          {t('roleAtOrganisation', { organisation: testimonial.organisation, role: testimonial.role })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='pricing'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading description={t('pricingSection.description')} title={t('pricingSection.title')} />

          <div className='mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch'>
            {localisedPlans.map((plan) => (
              <Card
                className={`border-border bg-muted text-foreground flex flex-col rounded-sm shadow-none ${
                  plan.popular ? 'lg:-mt-4' : ''
                }`}
                key={plan.name}
              >
                <CardHeader>
                  <div className='flex items-center justify-between gap-4'>
                    <CardTitle className='text-lg font-medium'>{plan.name}</CardTitle>
                    {plan.popular ? (
                      <Badge className='bg-primary/10 text-primary hover:bg-primary/10 rounded-sm'>
                        {t('mostPopular')}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className='text-muted-foreground pt-2 text-sm leading-6'>
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-4xl font-normal tracking-[-0.04em]'>{plan.price}</p>
                  <Separator className='bg-foreground/10 my-6' />
                  <ul className='space-y-3' role='list'>
                    {plan.features.map((feature: string) => (
                      <li className='text-muted-foreground flex items-center gap-3 text-sm' key={feature}>
                        <Check aria-hidden='true' className='text-primary size-4' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className='mt-auto'>
                  <Button
                    asChild
                    className={cn(
                      marketingButtonClassName,
                      'w-full',
                      plan.popular
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : 'border-border text-foreground hover:bg-accent hover:text-foreground bg-transparent',
                    )}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    <Link href='/account/create'>{t('getStarted')}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='compliance'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end'>
            <SCSectionHeading description={t('compliance.description')} title={t('compliance.title')} />
            <div className='border-border bg-foreground/10 grid grid-cols-2 gap-px overflow-hidden rounded-sm border sm:grid-cols-3'>
              {(t.raw('compliance.items') as string[]).map((item) => (
                <div className='bg-muted flex items-center gap-3 px-5 py-6' key={item}>
                  <CircleCheckBig aria-hidden='true' className='text-primary size-4 shrink-0' />
                  <span className='text-foreground/65 text-sm'>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='faq'>
        <div className='mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8'>
          <SCSectionHeading description={t('faqSection.description')} title={t('faqSection.title')} />
          <Accordion className='w-full' collapsible type='single'>
            {faqs.map((faq, index) => (
              <AccordionItem className='border-border' key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className='text-foreground py-5 text-base font-medium hover:no-underline'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground max-w-2xl pb-5 text-base leading-7'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='cta'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='border-border bg-card grid overflow-hidden rounded-sm border lg:grid-cols-2'>
            <div className='flex flex-col justify-center p-8 sm:p-12 lg:p-16'>
              <h2 className='text-[2.375rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance'>
                {t('cta.title')}
              </h2>
              <p className='text-muted-foreground mt-5 max-w-lg text-base leading-7'>{t('cta.description')}</p>
              <div className='mt-8'>
                <Button
                  asChild
                  className={cn(marketingButtonClassName, 'bg-foreground text-background hover:bg-foreground/90')}
                >
                  <Link href='/account/create'>{t('createAccount')}</Link>
                </Button>
              </div>
            </div>
            <div className='bg-primary/10 min-h-80 overflow-hidden'>
              <Image
                alt={t('images.mobileExperience')}
                className='h-full w-full object-cover object-left-top'
                height={507}
                sizes='(max-width: 1024px) 100vw, 50vw'
                src='/images/sc_demo/sc-marketing-hero-backup.webp'
                width={900}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
