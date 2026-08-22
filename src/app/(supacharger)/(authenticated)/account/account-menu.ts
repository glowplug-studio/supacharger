import { Bell, CreditCard, DivideIcon as LucideIcon, Lock,Shield, User } from 'lucide-react';

export interface Tab {
  id: string;
  labelKey: 'accountSecurity' | 'billing' | 'editProfile' | 'notifications' | 'privacy';
  path: string;
  icon: typeof LucideIcon;
}

export const tabs: Tab[] = [
  {
    id: 'account-security',
    labelKey: 'accountSecurity',
    path: '/account/',
    icon: Shield,
  },
  {
    id: 'edit-profile',
    labelKey: 'editProfile',
    path: '/account/edit-profile',
    icon: User,
  },
  {
    id: 'notifications',
    labelKey: 'notifications',
    path: '/account/notifications',
    icon: Bell,
  },
  {
    id: 'privacy',
    labelKey: 'privacy',
    path: '/account/privacy',
    icon: Lock,
  },
  {
    id: 'billing',
    labelKey: 'billing',
    path: '/account/billing',
    icon: CreditCard,
  },
];

export function getTabIdFromPath(path: string): string {
  const tab = tabs.find((tab) => tab.path === path);
  return tab ? tab.id : '';
}
