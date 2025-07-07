'use client';

import {  useState } from 'react';
import Link from 'next/link';

import SCAccountMenu from '@/components/sc_demo/sc_account-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ModeToggle from '@/supacharger/components/buttons/mode-toggle-button';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

export function SCHeaderSession() {

  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClasses =
    'flex h-full items-center border-b-2 border-transparent px-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700';
  const mobileLinkClasses =
    'flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  return (
    <>
      <header className='flex h-14 items-center justify-between border-b border-border px-8 py-6 shadow-sm'>
        <div className='flex h-full items-center'>
          {/* Mobile Menu */}
          <div className='mr-4 lg:hidden'>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={`flex h-8 w-8 flex-col items-center justify-center space-y-1 rounded-md border border-gray-200 ${focusClasses}`}
                  aria-label='Open navigation menu'
                  aria-expanded={mobileMenuOpen}
                >
                  <span className='h-0.5 w-4 bg-slate-800' />
                  <span className='h-0.5 w-4 bg-slate-800' />
                  <span className='h-0.5 w-4 bg-slate-800' />
                </button>
              </SheetTrigger>
              <SheetContent side='left' className='w-[240px] p-0' aria-label='Navigation menu'>
                <div className='flex flex-col py-2'>
                  <div className='px-4 py-2' role='banner'>
                  <SCSiteLogo showSiteTitle={true}></SCSiteLogo>
                  </div>
                  <nav className='mt-2 border-t border-gray-100 pt-4' role='navigation' aria-label='Main navigation'>
                    <Link
                      href='/#'
                      className={`${mobileLinkClasses} ${focusClasses}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href='/#'
                      className={`${mobileLinkClasses} ${focusClasses}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Deals
                    </Link>
                    <Link
                      href='/#'
                      className={`${mobileLinkClasses} ${focusClasses}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Connections
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <div className='mr-8' role='banner'>
            <SCSiteLogo></SCSiteLogo>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden h-full lg:flex' role='navigation' aria-label='Main navigation'>
            <Link href='/' className={`${linkClasses} ${focusClasses}`}>
              Dashboard
            </Link>
            <Link href='/#' className={`${linkClasses} ${focusClasses}`}>
              Deals
            </Link>
            <Link href='/#' className={`${linkClasses} ${focusClasses}`}>
              Connections
            </Link>
          </nav>
        </div>
        <div className=''>
          <SCAccountMenu></SCAccountMenu>
        </div>
      </header>
    </>
  );
}
