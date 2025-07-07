'use client';

import Link from 'next/link';
import {  Calendar, Component, Landmark, Menu, Trees, Warehouse } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

// MenuItem and Navbar1Props interfaces
interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

// Example menu data
const menu: MenuItem[] = [
  {
    title: "Use Cases",
    url: "#",
    items: [
      {
        title: "Advocacy Groups",
        description: "Mobilize members and campaigns",
        icon: <Component className="size-6 shrink-0 text-secondary mt-2" />,
        url: "#",
      },
      {
        title: "Interest Meetups",
        description: "Organize and grow your community",
        icon: <Calendar className="size-6 shrink-0 text-secondary mt-2" />,
        url: "#",
      },
      {
        title: "Aligned Businesses",
        description: "Connect with like-minded partners",
        icon: <Landmark className="size-6 shrink-0 text-secondary mt-2" />,
        url: "#",
      },
      {
        title: "Retail Owners",
        description: "Engage local customers and networks",
        icon: <Warehouse className="size-6 shrink-0 text-secondary mt-2" />,
        url: "#",
      },
    ],
  },
  { title: "About", url: "/about" },
  { title: "Pricing", url: "/pricing" }
  
];

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className="flex flex-row gap-6 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      <div className="text-foreground mr-1">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className="w-80">
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="group inline-flex h-10 w-max items-center justify-center p-1 font-medium transition-colors hover:text-primary"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </Link>
  );
};

export function SCMarketingMenu() {

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-border shadow-slate-400/10 shadow-lg bg-white/80 dark:shadow-slate-800/40 dark:bg-gray-900/90 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        {/* Desktop Menu */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <SCSiteLogo showSiteTitle={true}></SCSiteLogo>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="account/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="account/create">Create Account</Link>
            </Button>
            <LocaleSwitcher />
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <SCSiteLogo showSiteTitle={false}></SCSiteLogo>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <SCSiteLogo showSiteTitle={true}></SCSiteLogo>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  <div className="flex flex-col gap-3">
                    <Button asChild variant="outline">
                    <Link href="account/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="account/create">Create Account</Link>
                    </Button>
                    <LocaleSwitcher />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
