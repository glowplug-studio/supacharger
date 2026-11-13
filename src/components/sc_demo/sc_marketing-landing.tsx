import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  LockKeyhole,
  MapPin,
  MessageSquareMore,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import DiscordLogo from '@/supacharger/assets/svgr/auth-providers/discord-icon.svg';
import FigmaLogo from '@/supacharger/assets/svgr/auth-providers/figma-icon.svg';
import GitHubLogo from '@/supacharger/assets/svgr/auth-providers/github-icon.svg';
import GoogleLogo from '@/supacharger/assets/svgr/auth-providers/google-icon.svg';
import MicrosoftLogo from '@/supacharger/assets/svgr/auth-providers/microsoft-icon.svg';
import SlackLogo from '@/supacharger/assets/svgr/auth-providers/slack-icon.svg';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/supacharger/components/ui/accordion';
import { Badge } from '@/supacharger/components/ui/badge';
import { Button } from '@/supacharger/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/supacharger/components/ui/card';
import { Separator } from '@/supacharger/components/ui/separator';
import { cn } from '@/utils/cn';

import SCLogoMarquee from './sc_logo_marquee';

type DemoLogo = ComponentType<SVGProps<SVGSVGElement>>;

const marketingButtonClassName = 'h-auto rounded-lg px-5 py-3 text-sm';
const marketingPrimaryButtonClassName =
  'bg-foreground text-background hover:bg-foreground/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.3)] active:scale-[0.98]';

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
    imageClassName: 'object-cover object-center',
    imageHeight: 967,
    imageSrc: '/images/sc_demo/sc-marketing-mobile-onboarding.webp',
    imageWidth: 1626,
  },
  {
    id: 'workspace',
    imageClassName: 'object-contain object-center',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-chat-workspace.webp',
    imageWidth: 1448,
  },
  {
    id: 'participation',
    imageClassName: 'object-contain object-center',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-community-night.webp',
    imageWidth: 1448,
  },
];

const connectedExperiences = [
  {
    href: '#overview',
    imageClassName: 'object-contain object-center',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-app-multi.webp',
    imageWidth: 1448,
  },
  {
    href: '#benefits',
    imageClassName: 'object-contain object-center',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-profile-discovery.webp',
    imageWidth: 1448,
  },
  {
    href: '/account/create',
    imageClassName: 'object-contain object-center',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-mobile-community.webp',
    imageWidth: 1448,
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
  // Marketing shape system: 8px surfaces and controls, with circular avatars preserved.
  return (
    <main className='bg-background text-foreground overflow-hidden'>
      <section className='relative min-h-[100dvh] scroll-mt-16 pt-16' id='hero'>
        <div className='absolute inset-x-0 top-10 h-[880px] bg-[radial-gradient(ellipse_at_50%_8%,rgba(0,163,80,0.14),transparent_78%)]' />
        <div className='relative mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32'>
          <div className='sc-home-enter mx-auto max-w-4xl text-center'>
            <Link
              className='border-border bg-card/80 text-foreground hover:border-foreground/20 inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-1.5 pl-1.5 shadow-sm backdrop-blur transition-colors'
              href='/features/whats-included'
            >
              <span className='bg-foreground text-background rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase'>
                {t('hero.updateBadge')}
              </span>
              <span className='text-sm font-medium'>{t('hero.updateText')}</span>
              <span className='bg-foreground/5 flex size-6 items-center justify-center rounded-full'>
                <ArrowUpRight aria-hidden='true' className='size-3.5' />
              </span>
            </Link>
            <h1 className='mx-auto mt-8 max-w-4xl text-5xl leading-[1.05] font-normal tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl'>
              {t('hero.title')}
            </h1>
            <p className='text-muted-foreground mx-auto mt-7 max-w-2xl text-lg leading-8'>{t('hero.description')}</p>
            <div className='mt-10 flex flex-wrap justify-center gap-3'>
              <Button asChild className={cn(marketingButtonClassName, marketingPrimaryButtonClassName)}>
                <Link href='/account/create'>{t('createAccount')}</Link>
              </Button>
              <Button
                asChild
                className={cn(
                  marketingButtonClassName,
                  'border-border bg-white text-neutral-950 shadow-none hover:bg-white/90 hover:text-neutral-950 active:scale-[0.98]',
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

          <div className='sc-home-enter-delayed mt-20 overflow-hidden lg:mt-24'>
            <Image
              alt={t('images.messagingWorkspace')}
              className='h-auto w-full rounded-lg'
              height={873}
              priority
              sizes='(max-width: 1280px) 100vw, 1216px'
              src='/images/sc_demo/sc-marketing-desktop-hero.webp'
              width={1522}
            />
          </div>

          <SCLogoMarquee label={t('trustedOrganisations')} />

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
          <div className='overflow-hidden rounded-lg bg-[#e4f7e8]'>
            <Image
              alt={t('images.mobileScreens')}
              className='h-full w-full object-contain object-center transition-transform duration-500 hover:scale-[1.015]'
              height={1024}
              loading='lazy'
              sizes='(max-width: 1024px) 100vw, 58vw'
              src='/images/sc_demo/sc-marketing-hero.webp'
              width={1536}
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
                className='group border-border bg-card text-foreground overflow-hidden rounded-lg py-0 shadow-none'
                key={feature.id}
              >
                <div className='aspect-[4/3] overflow-hidden bg-[#e4f7e8]'>
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
          <div className='border-border bg-foreground/10 mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-3 lg:grid-cols-6'>
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
            <div className='aspect-[16/9] overflow-hidden rounded-lg bg-[#e4f7e8] lg:aspect-auto lg:min-h-[420px]'>
              <Image
                alt={t('images.neighboursAtNight')}
                className='h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]'
                height={941}
                sizes='(max-width: 1024px) 100vw, 52vw'
                src='/images/sc_demo/sc-marketing-community-night-backup.webp'
                width={1672}
              />
            </div>
          </div>
        </div>
      </section>

      <section className='border-border bg-muted/35 scroll-mt-16 border-y py-20' id='about'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading description={t('experiences.description')} title={t('experiences.title')} />

          <div className='mt-16 space-y-16 lg:space-y-24'>
            {localisedExperiences.map((experience, index) => (
              <div className='grid items-center gap-9 md:grid-cols-2 lg:gap-16' key={experience.title}>
                <div className={`overflow-hidden rounded-lg bg-[#e4f7e8] ${index % 2 === 1 ? 'md:order-2' : ''}`}>
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
                  <Button asChild className={cn(marketingButtonClassName, marketingPrimaryButtonClassName, 'mt-7')}>
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
              <Card className='border-border bg-muted text-foreground rounded-lg shadow-none' key={testimonial.name}>
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
                className={`border-border bg-muted text-foreground flex flex-col rounded-lg shadow-none ${
                  plan.popular ? 'lg:-mt-4' : ''
                }`}
                key={plan.name}
              >
                <CardHeader>
                  <div className='flex items-center justify-between gap-4'>
                    <CardTitle className='text-lg font-medium'>{plan.name}</CardTitle>
                    {plan.popular ? (
                      <Badge className='bg-primary/10 text-primary hover:bg-primary/10 rounded-lg'>
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
                        ? marketingPrimaryButtonClassName
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

      <section className='scroll-mt-16 py-[72px]' id='faq'>
        <div className='mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8'>
          <SCSectionHeading description={t('faqSection.description')} title={t('faqSection.title')} />
          <Accordion className='w-full'>
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
          <div className='border-border bg-card grid overflow-hidden rounded-lg border lg:grid-cols-2'>
            <div className='flex flex-col justify-center p-8 sm:p-12 lg:p-16'>
              <h2 className='text-[2.375rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance'>
                {t('cta.title')}
              </h2>
              <p className='text-muted-foreground mt-5 max-w-lg text-base leading-7'>{t('cta.description')}</p>
              <div className='mt-8'>
                <Button asChild className={cn(marketingButtonClassName, marketingPrimaryButtonClassName)}>
                  <Link href='/account/create'>{t('createAccount')}</Link>
                </Button>
              </div>
            </div>
            <div className='min-h-80 overflow-hidden bg-[#dbfded]'>
              <Image
                alt={t('images.mobileExperience')}
                className='h-full w-full object-contain object-center'
                height={941}
                sizes='(max-width: 1024px) 100vw, 50vw'
                src='/images/sc_demo/sc-marketing-hero-backup.webp'
                width={1672}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
