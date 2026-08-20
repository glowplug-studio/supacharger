import Image from 'next/image';
import Link from 'next/link';
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

import DiscordLogo from '@/assets/images/authProviderIcons/discord-icon.svg';
import FigmaLogo from '@/assets/images/authProviderIcons/figma-icon.svg';
import GitHubLogo from '@/assets/images/authProviderIcons/github-icon.svg';
import GoogleLogo from '@/assets/images/authProviderIcons/google-icon.svg';
import MicrosoftLogo from '@/assets/images/authProviderIcons/microsoft-icon.svg';
import SlackLogo from '@/assets/images/authProviderIcons/slack-icon.svg';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';

type DemoLogo = ComponentType<SVGProps<SVGSVGElement>>;

const marketingButtonClassName = 'h-auto rounded-sm px-5 py-3 text-sm';

const communityPillars = [
  {
    description: 'Keep every conversation easy to find and simple to follow.',
    icon: MessageSquareMore,
    title: 'Shared conversations',
  },
  {
    description: 'Bring members, neighbours, and organisers into one trusted space.',
    icon: UsersRound,
    title: 'Real communities',
  },
  {
    description: 'Coordinate events and recurring meetups without scattered tools.',
    icon: CalendarDays,
    title: 'Events that connect',
  },
  {
    description: 'Use clear controls that keep each group private and manageable.',
    icon: ShieldCheck,
    title: 'Built-in trust',
  },
];

const platformFeatures = [
  {
    description: 'Bring nearby groups, organisers, and shared interests into one clear view.',
    imageAlt: 'Korunet community discovery screens',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 1254,
    imageSrc: '/images/sc_demo/sc-marketing-app-multi.webp',
    imageWidth: 1254,
    title: 'Discover your community',
  },
  {
    description: 'Keep messages, profiles, and community activity connected across every screen.',
    imageAlt: 'Korunet community messaging workspace',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-desktop-hero.jpeg',
    imageWidth: 1448,
    title: 'One shared workspace',
  },
  {
    description: 'Give members a welcoming place to meet, contribute, and stay involved.',
    imageAlt: 'Local neighbours gathering in a shared community space',
    imageClassName: 'object-cover object-center',
    imageHeight: 941,
    imageSrc: '/images/sc_demo/sc-marketing-community-night.webp',
    imageWidth: 1672,
    title: 'Participation that lasts',
  },
];

const connectedExperiences = [
  {
    cta: 'Explore discovery',
    description: 'Find relevant groups, people, and activity without searching across disconnected services.',
    href: '#overview',
    imageAlt: 'Korunet community profiles and discovery experience',
    imageClassName: 'object-cover object-top',
    imageHeight: 1254,
    imageSrc: '/images/sc_demo/sc-marketing-app-multi.webp',
    imageWidth: 1254,
    title: 'Find the people and groups around you',
  },
  {
    cta: 'See community tools',
    description: 'Plan events, share updates, and keep the full conversation available to every member.',
    href: '#benefits',
    imageAlt: 'Korunet community workspace with messages and activity',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 1086,
    imageSrc: '/images/sc_demo/sc-marketing-desktop-hero.jpeg',
    imageWidth: 1448,
    title: 'Coordinate activity from one clear home',
  },
  {
    cta: 'Create account',
    description: 'Make it easy for new members to understand where they belong and how to take part.',
    href: '/account/create',
    imageAlt: 'Korunet mobile community experience',
    imageClassName: 'object-cover object-left-top',
    imageHeight: 1024,
    imageSrc: '/images/sc_demo/sc-marketing-hero.webp',
    imageWidth: 1536,
    title: 'Turn introductions into participation',
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
  {
    description: 'Create spaces around a place, cause, interest, or shared goal.',
    icon: MapPin,
    title: 'Local by design',
  },
  {
    description: 'Set roles and permissions without slowing organisers down.',
    icon: SlidersHorizontal,
    title: 'Flexible controls',
  },
  {
    description: 'Find people, conversations, and groups from one clear search.',
    icon: Search,
    title: 'Fast discovery',
  },
  {
    description: 'Keep members informed without turning every update into noise.',
    icon: BellRing,
    title: 'Useful notifications',
  },
  {
    description: 'Protect personal details with private spaces and clear choices.',
    icon: LockKeyhole,
    title: 'Privacy first',
  },
  {
    description: 'Support small circles and larger organisations on one platform.',
    icon: Building2,
    title: 'Ready to grow',
  },
];

const testimonials = [
  {
    avatarAlt: 'Portrait of Maya Okafor',
    avatarSrc: '/images/sc_demo/sc-testimonial-maya.webp',
    organisation: 'Northside Neighbours',
    name: 'Maya Okafor',
    quote: 'Koruunet brought our events, member updates, and local conversations into one place people actually check.',
    role: 'Neighbourhood organiser',
  },
  {
    avatarAlt: 'Portrait of Luca Moretti',
    avatarSrc: '/images/sc_demo/sc-testimonial-luca.webp',
    organisation: 'Common Ground',
    name: 'Luca Moretti',
    quote: 'New members understand where to go, who to ask, and how to take part from their first day.',
    role: 'Community host',
  },
  {
    avatarAlt: 'Portrait of Sora Kim',
    avatarSrc: '/images/sc_demo/sc-testimonial-sora.webp',
    organisation: 'Riverside Network',
    name: 'Sora Kim',
    quote: 'We spend less time chasing messages and more time helping neighbours turn good ideas into real events.',
    role: 'Volunteer coordinator',
  },
  {
    avatarAlt: 'Portrait of Tomasz Kowalski',
    avatarSrc: '/images/sc_demo/sc-testimonial-tomasz.webp',
    organisation: 'Open Door Collective',
    name: 'Tomasz Kowalski',
    quote:
      'Private spaces and clear roles let our volunteers work confidently without making the platform feel complicated.',
    role: 'Programme lead',
  },
  {
    avatarAlt: 'Portrait of Elias Novak',
    avatarSrc: '/images/sc_demo/sc-testimonial-elias.webp',
    organisation: 'Market Lane',
    name: 'Elias Novak',
    quote:
      'Nearby groups now share opportunities and organise meetups without every conversation disappearing into another app.',
    role: 'Local business owner',
  },
  {
    avatarAlt: 'Portrait of Camille Laurent',
    avatarSrc: '/images/sc_demo/sc-testimonial-camille.webp',
    organisation: 'Mosaic House',
    name: 'Camille Laurent',
    quote: 'Koruunet gives every project enough structure while keeping the community warm, visible, and easy to join.',
    role: 'Cultural network coordinator',
  },
];

const plans = [
  {
    description: 'Start a focused group and bring your first members together.',
    features: ['Core community spaces', 'Direct conversations', 'Event planning', 'Member profiles'],
    name: 'Starter',
    price: 'Free',
  },
  {
    description: 'Run an active community with more control and collaboration.',
    features: ['Everything in Starter', 'Advanced roles', 'Multiple organisers', 'Priority support'],
    name: 'Community',
    popular: true,
    price: '9.99 USD/mo',
  },
  {
    description: 'Coordinate several communities with tailored support and governance.',
    features: ['Everything in Community', 'Organisation controls', 'Custom onboarding', 'Dedicated support'],
    name: 'Organisation',
    price: 'Custom',
  },
];

const faqs = [
  {
    answer:
      'Korunet brings community conversations, direct messages, groups, events, and member discovery into one shared platform.',
    question: 'What can I manage with Korunet?',
  },
  {
    answer:
      'Yes. Communities can control who joins, what members can see, and which roles can organise or moderate each space.',
    question: 'Can communities stay private?',
  },
  {
    answer:
      'Korunet is designed for neighbourhood groups, meetups, advocacy networks, local businesses, and larger community organisations.',
    question: 'Who is Korunet for?',
  },
  {
    answer:
      'Members can switch the interface language from the header or footer. The current demo includes English and French.',
    question: 'Does Korunet support multiple languages?',
  },
  {
    answer:
      'Create an account, set up your profile, and begin with a focused group. You can add more spaces as the community grows.',
    question: 'How do I get started?',
  },
];

interface SCSectionHeadingProps {
  description: string;
  title: string;
}

function SCSectionHeading({ description, title }: SCSectionHeadingProps) {
  return (
    <div className='max-w-2xl'>
      <h2 className='text-[2.375rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance text-white'>{title}</h2>
      <p className='mt-5 max-w-[60ch] text-base leading-7 text-white/55'>{description}</p>
    </div>
  );
}

export default function SCMarketingLanding() {
  // Marketing shape system: 4px surfaces and controls, with circular avatars preserved.
  return (
    <main className='overflow-hidden bg-[#080a09] text-white'>
      <section className='relative min-h-[100dvh] scroll-mt-16 pt-16' id='hero'>
        <div className='absolute inset-x-0 top-16 h-[560px] bg-[radial-gradient(circle_at_50%_18%,rgba(0,163,80,0.12),transparent_58%)]' />
        <div className='relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-24'>
          <div className='sc-home-enter max-w-4xl'>
            <h1 className='max-w-4xl text-[2.75rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance sm:text-5xl'>
              The community platform for stronger local connections.
            </h1>
            <p className='mt-6 max-w-2xl text-base leading-7 text-white/60'>
              Bring conversations, groups, events, and trusted local connections into one calm, shared place built for
              real communities.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Button
                asChild
                className={cn(
                  marketingButtonClassName,
                  'bg-white text-[#080a09] shadow-none hover:bg-white/90 active:scale-[0.98]',
                )}
              >
                <Link href='/account/create'>Create account</Link>
              </Button>
              <Button
                asChild
                className={cn(
                  marketingButtonClassName,
                  'border-white/15 bg-white/5 text-white shadow-none hover:bg-white/10 hover:text-white active:scale-[0.98]',
                )}
                variant='outline'
              >
                <Link href='#overview'>
                  Explore features
                  <ArrowRight aria-hidden='true' />
                </Link>
              </Button>
            </div>
          </div>

          <div className='sc-home-enter-delayed mt-14 overflow-hidden rounded-sm border border-white/10 bg-[#151716] p-2 shadow-2xl shadow-black/40 sm:p-4'>
            <Image
              alt='Korunet community messaging workspace'
              className='h-auto w-full rounded-sm'
              height={1086}
              priority
              sizes='(max-width: 1280px) 100vw, 1216px'
              src='/images/sc_demo/sc-marketing-desktop-hero.jpeg'
              width={1448}
            />
          </div>

          <div className='mt-8 grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4'>
            {communityPillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <div
                  className={`py-6 sm:px-6 ${
                    index > 0 ? 'border-t border-white/10 sm:border-t-0' : ''
                  } ${index % 2 === 1 ? 'sm:border-l' : ''} ${index > 1 ? 'lg:border-l' : ''}`}
                  key={pillar.title}
                >
                  <Icon aria-hidden='true' className='size-5 text-emerald-300' />
                  <h2 className='mt-4 text-sm font-medium'>{pillar.title}</h2>
                  <p className='mt-2 text-sm leading-6 text-white/45'>{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='overview'>
        <div className='mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8'>
          <SCSectionHeading
            description='Keep the people, context, and activity around every community visible without stitching together a collection of unrelated tools.'
            title='One place for the communities around you'
          />
          <div className='overflow-hidden rounded-sm border border-white/10 bg-[#151716]'>
            <Image
              alt='Korunet mobile community screens'
              className='h-full w-full object-cover transition-transform duration-500 hover:scale-[1.015]'
              height={1024}
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
          <SCSectionHeading
            description='Start with a focused group, then add the conversations, events, and structure your community needs as it grows.'
            title='A platform that adapts to your community'
          />

          <div className='relative mt-12 grid gap-5 md:grid-cols-3'>
            {platformFeatures.map((feature) => (
              <Card
                className='group overflow-hidden rounded-sm border-white/10 bg-[#151716] py-0 text-white shadow-none'
                key={feature.title}
              >
                <div className='aspect-[4/3] overflow-hidden bg-emerald-950/20'>
                  <Image
                    alt={feature.imageAlt}
                    className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.02] ${feature.imageClassName}`}
                    height={feature.imageHeight}
                    sizes='(max-width: 768px) 100vw, 33vw'
                    src={feature.imageSrc}
                    width={feature.imageWidth}
                  />
                </div>
                <CardHeader className='gap-4 bg-[#151716] px-6 pt-8 pb-8 sm:px-7 sm:pt-9'>
                  <CardTitle className='text-2xl font-normal tracking-[-0.03em]'>{feature.title}</CardTitle>
                  <CardDescription className='text-base leading-7 text-white/50'>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='integrations'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading
            description='Connect familiar services while Korunet remains the shared place members return to for community activity.'
            title='Works with the tools people already know'
          />
          <div className='mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-6'>
            {integrations.map(({ Logo, name }) => (
              <div
                className='flex min-h-32 items-center justify-center bg-[#101211] p-6 transition-colors hover:bg-[#171a18]'
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
          <SCSectionHeading
            description='Give real-world groups the structure they need while keeping the product warm, clear, and easy to take part in.'
            title='A flexible foundation for local connection'
          />

          <div className='mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-stretch'>
            <div className='grid gap-x-8 sm:grid-cols-2'>
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div className='border-t border-white/10 py-6' key={benefit.title}>
                    <Icon aria-hidden='true' className='size-5 text-emerald-300' />
                    <h3 className='mt-4 text-base font-medium'>{benefit.title}</h3>
                    <p className='mt-2 text-sm leading-6 text-white/45'>{benefit.description}</p>
                  </div>
                );
              })}
            </div>
            <div className='min-h-[420px] overflow-hidden rounded-sm border border-white/10 bg-[#151716]'>
              <Image
                alt='Local neighbours gathering in shared community spaces at night'
                className='h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]'
                height={941}
                sizes='(max-width: 1024px) 100vw, 52vw'
                src='/images/sc_demo/sc-marketing-community-night.webp'
                width={1672}
              />
            </div>
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='about'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <SCSectionHeading
            description='Move between discovery, organised groups, and direct conversations without losing the context that makes each connection useful.'
            title='Everything your community needs to stay connected'
          />

          <div className='mt-16 space-y-16 lg:space-y-24'>
            {connectedExperiences.map((experience, index) => (
              <div className='grid items-center gap-9 md:grid-cols-2 lg:gap-16' key={experience.title}>
                <div
                  className={`overflow-hidden rounded-sm border border-white/10 bg-[#151716] ${
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
                  <p className='mt-5 text-base leading-7 text-white/55'>{experience.description}</p>
                  <Button
                    asChild
                    className={cn(
                      marketingButtonClassName,
                      'mt-7 bg-white text-[#080a09] hover:bg-white/90 active:scale-[0.98]',
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
          <SCSectionHeading
            description='A clear community experience helps organisers spend less time managing tools and more time bringing people together.'
            title='Trusted by people who make communities work'
          />

          <div className='mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {testimonials.map((testimonial) => (
              <Card className='rounded-sm border-white/10 bg-[#101211] text-white shadow-none' key={testimonial.name}>
                <CardContent className='flex min-h-[320px] flex-col p-7 sm:p-8'>
                  <p className='text-lg leading-8 tracking-[-0.02em] text-white/80'>“{testimonial.quote}”</p>
                  <div className='mt-auto pt-8'>
                    <Separator className='mb-7 bg-white/10' />
                    <div className='flex items-center gap-4'>
                      <Image
                        alt={testimonial.avatarAlt}
                        className='size-14 shrink-0 rounded-full object-cover'
                        height={56}
                        src={testimonial.avatarSrc}
                        width={56}
                      />
                      <div className='min-w-0'>
                        <p className='text-base font-medium text-white'>{testimonial.name}</p>
                        <p className='mt-1 text-sm leading-5 text-white/45'>
                          {testimonial.role} at {testimonial.organisation}
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
          <SCSectionHeading
            description='Start with the shape your community needs today, then add more coordination and support as participation grows.'
            title='Pricing that grows with your community'
          />

          <div className='mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch'>
            {plans.map((plan) => (
              <Card
                className={`flex flex-col rounded-sm border-white/10 bg-[#101211] text-white shadow-none ${
                  plan.popular ? 'lg:-mt-4' : ''
                }`}
                key={plan.name}
              >
                <CardHeader>
                  <div className='flex items-center justify-between gap-4'>
                    <CardTitle className='text-lg font-medium'>{plan.name}</CardTitle>
                    {plan.popular ? (
                      <Badge className='rounded-sm bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/10'>
                        Most popular
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className='pt-2 text-sm leading-6 text-white/50'>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-4xl font-normal tracking-[-0.04em]'>{plan.price}</p>
                  <Separator className='my-6 bg-white/10' />
                  <ul className='space-y-3' role='list'>
                    {plan.features.map((feature) => (
                      <li className='flex items-center gap-3 text-sm text-white/60' key={feature}>
                        <Check aria-hidden='true' className='size-4 text-emerald-300' />
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
                        ? 'bg-white text-[#080a09] hover:bg-white/90'
                        : 'border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white',
                    )}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    <Link href='/account/create'>Get Started</Link>
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
            <SCSectionHeading
              description='Clear permissions, private spaces, and responsible defaults keep members in control of how they participate.'
              title='Trust is part of the product'
            />
            <div className='grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3'>
              {[
                'Private spaces',
                'Clear roles',
                'Data control',
                'Secure access',
                'Member choice',
                'Responsible defaults',
              ].map((item) => (
                <div className='flex items-center gap-3 bg-[#101211] px-5 py-6' key={item}>
                  <CircleCheckBig aria-hidden='true' className='size-4 shrink-0 text-emerald-300' />
                  <span className='text-sm text-white/65'>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='faq'>
        <div className='mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8'>
          <SCSectionHeading
            description='The essentials about spaces, privacy, access, languages, and getting your first community started.'
            title='Everything you need to move forward'
          />
          <Accordion className='w-full' collapsible type='single'>
            {faqs.map((faq, index) => (
              <AccordionItem className='border-white/10' key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className='py-5 text-base font-medium text-white hover:no-underline'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='max-w-2xl pb-5 text-base leading-7 text-white/50'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className='scroll-mt-16 py-[72px]' id='cta'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid overflow-hidden rounded-sm border border-white/10 bg-[#151716] lg:grid-cols-2'>
            <div className='flex flex-col justify-center p-8 sm:p-12 lg:p-16'>
              <h2 className='text-[2.375rem] leading-[1.1] font-normal tracking-[-0.04em] text-balance'>
                Bring your community closer together
              </h2>
              <p className='mt-5 max-w-lg text-base leading-7 text-white/55'>
                Create a focused space for the people, conversations, and activity that matter locally.
              </p>
              <div className='mt-8'>
                <Button asChild className={cn(marketingButtonClassName, 'bg-white text-[#080a09] hover:bg-white/90')}>
                  <Link href='/account/create'>Create account</Link>
                </Button>
              </div>
            </div>
            <div className='min-h-80 overflow-hidden bg-emerald-950/20'>
              <Image
                alt='Korunet community experience across mobile screens'
                className='h-full w-full object-cover object-left-top'
                height={1024}
                sizes='(max-width: 1024px) 100vw, 50vw'
                src='/images/sc_demo/sc-marketing-hero.webp'
                width={1536}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
