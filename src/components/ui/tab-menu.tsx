'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Tab, tabs } from '@/app/(supacharger)/(authenticated)/account/account-menu';
import { useDraggableScroll } from '@/hooks/use-draggable-scroll'
import { cn } from '@/utils/cn';

interface TabMenuProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function TabMenu({
  orientation = 'vertical',
  className,
}: TabMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Detect if we're in mobile view for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // For horizontal draggable scrolling on mobile
  const {
    ref,
    showLeftGradient,
    showRightGradient,
    handleMouseDown,
    handleTouchStart,
    scrollToStart,
    scrollToEnd,
    containerStyles,
  } = useDraggableScroll();

  // Handle tab click (no unsaved changes logic)
  const handleTabClick = (tab: Tab) => {
    if (tab.path !== pathname) {
      router.push(tab.path);
    }
  };

  // Determine if a tab is active
  const isTabActive = (tab: Tab) => {
    return pathname === tab.path;
  };

  // Render vertical tabs (desktop)
  if (orientation === 'vertical' && !isMobile) {
    return (
      <nav className={cn('space-y-1 py-2', className)}>
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'flex w-full items-center px-3 py-2 text-sm font-medium rounded-md',
                'transition-colors duration-200 ease-in-out',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Render horizontal tabs (mobile/tablet)
  return (
    <div className="relative">
      {/* Left fade gradient and button */}
      {showLeftGradient && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"></div>
          <button 
            onClick={scrollToStart}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-background border border-border z-20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Scrollable tab container */}
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={containerStyles}
        className={cn(
          'flex overflow-x-auto py-2 px-1 scrollbar-hide',
          'cursor-grab active:cursor-grabbing',
          className
        )}
      >
        {tabs.map((tab) => {
          const active = isTabActive(tab);

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md',
                'transition-all duration-200 ease-in-out mr-2 flex-shrink-0',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right fade gradient and button */}
      {showRightGradient && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"></div>
          <button 
            onClick={scrollToEnd}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-background border border-border z-20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
