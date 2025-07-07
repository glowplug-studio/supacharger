'use client';
import Link from 'next/link';

import FacebookLogo from '@/assets/images/socialAuthIcons/FacebookLogo.svg';
import GoogleLogo from '@/assets/images/socialAuthIcons/GoogleLogo.svg';
import LinkedinLogo from '@/assets/images/socialAuthIcons/LinkedinLogo.svg';
import ModeToggle from '@/supacharger/components/buttons/mode-toggle-button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

export default function SCFooter() {
  return (
    <footer className='bg-gray-100 dark:bg-muted'>
      <div className='mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32'>
        <div className='xl:grid xl:grid-cols-3 xl:gap-8'>
          <div className='space-y-8'>
            <div className='items-cente flex'>
              <SCSiteLogo showSiteTitle={true} />
            </div>
            {/* Social Links */}
            <div className='flex gap-x-6'>
              <Link href='#' className=''>
                <span className='sr-only'>Facebook</span>
                <FacebookLogo height='22' width='22' />
              </Link>
              <Link href='#' className=''>
                <span className='sr-only'>Google</span>
                <GoogleLogo height='22' width='22' />
              </Link>
              <Link href='#' className=''>
                <span className='sr-only'>LinkedIn</span>
                <LinkedinLogo height='26' width='26' />
              </Link>
            </div>
            <Link className="mt-6 block" href="/legal">Terms of Use</Link>
          </div>
          <div className='mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 xl:col-span-2 xl:mt-0'>
            {/* Applications */}
            <div>
              <h3 className='text-sm/6 font-semibold text-gray-900 dark:text-white'>Applications</h3>
              <ul role='list' className='mt-6 space-y-4'>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Advocacy Groups
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Interest Meetups
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Aligned Businesses
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Retail Owners
                  </Link>
                </li>
              </ul>
            </div>
            {/* Support */}
            <div>
              <h3 className='text-sm/6 font-semibold text-gray-900 dark:text-white'>Support</h3>
              <ul role='list' className='mt-6 space-y-4'>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Contact Form
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Guides
                  </Link>
                </li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className='text-sm/6 font-semibold text-gray-900 dark:text-white'>Company</h3>
              <ul role='list' className='mt-6 space-y-4'>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href='#'
                    className='text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  >
                    Press
                  </Link>
                </li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <span>Language</span>
                  <LocaleSwitcher />
                </div>
                <div className='flex items-center justify-between'>
                  <span>Theme</span>
                  <ModeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24'>
          <p className='text-xs/6 text-gray-600'>
            &copy; {SC_CONFIG.SITE_TITLE} {new Date().getFullYear()}, All rights reserved. 
          </p>
        </div>
      </div>
    </footer>
  );
}
