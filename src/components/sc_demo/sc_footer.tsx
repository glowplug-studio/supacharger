import Link from 'next/link';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

const footerGroups = [
  {
    label: 'Navigation',
    links: [
      { href: '/#overview', label: 'Overview' },
      { href: '/#features', label: 'Features' },
      { href: '/#integrations', label: 'Integrations' },
      { href: '/#benefits', label: 'Benefits' },
      { href: '/#reviews', label: 'Reviews' },
      { href: '/#pricing', label: 'Pricing' },
    ],
  },
  {
    label: 'Information',
    links: [
      { href: '/about', label: 'About' },
      { href: '/#faq', label: 'FAQ' },
      { href: '/legal', label: 'Terms of use' },
      { href: '/account/login', label: 'Login' },
      { href: '/account/create', label: 'Create account' },
    ],
  },
  {
    label: 'Socials',
    links: [
      { href: 'https://x.com', label: 'Twitter (X)' },
      { href: 'https://www.instagram.com', label: 'Instagram' },
      { href: 'https://www.linkedin.com', label: 'LinkedIn' },
    ],
  },
];

export default function SCFooter() {
  return (
    <footer className='border-t border-white/10 bg-[#121413] text-white'>
      <div className='mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8'>
        <div className='grid gap-12 lg:grid-cols-[1.35fr_2fr] lg:gap-20'>
          <div className='max-w-sm'>
            <SCSiteLogo darkMode={true} showSiteTitle={true} />
            <p className='mt-6 text-sm leading-6 text-white/60'>
              A shared community platform for conversations, groups, events, and the people nearby.
            </p>
            <div className='mt-8'>
              <LocaleSwitcher appearance='marketing' />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-10 sm:grid-cols-3'>
            {footerGroups.map((group) => (
              <div key={group.label}>
                <h2 className='text-sm font-medium text-white'>{group.label}</h2>
                <ul className='mt-5 space-y-3' role='list'>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link className='text-sm text-white/55 transition-colors hover:text-white' href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-16 flex flex-col gap-3 border-t border-white/10 pt-7 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between'>
          <p>
            © {new Date().getFullYear()} {SC_CONFIG.SITE_TITLE}. All rights reserved.
          </p>
          <p>Built for stronger local connections.</p>
        </div>
      </div>
    </footer>
  );
}
