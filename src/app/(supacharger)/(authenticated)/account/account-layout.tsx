'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { getTabIdFromPath } from '@/app/(supacharger)/(authenticated)/account/account-menu';
import { Separator } from '@/components/ui/seperator';
import { TabMenu } from '@/components/ui/tab-menu';

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Update active tab from URL path
  useEffect(() => {
    setActiveTabId(getTabIdFromPath(pathname));
  }, [pathname]);

  // Check viewport width for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <main className='container mx-auto px-4 py-6'>
      <h1 className='mb-6 text-2xl font-bold tracking-tight'>Account Settings</h1>

      {/* Mobile tabs (horizontal) */}
      {isMobile && (
        <div className='mb-4 md:hidden'>
          <TabMenu orientation='horizontal' />
          <Separator className='mt-2' />
        </div>
      )}

      <div className='flex flex-col gap-6 md:flex-row'>
        {/* Desktop sidebar (vertical) */}
        <div className='hidden w-64 shrink-0 md:block'>
          <TabMenu orientation='vertical' />
        </div>

        {/* Main content area */}
        <div className='flex-1'>{children}</div>
      </div>
    </main>
  );
}