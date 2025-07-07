import { Bell, CreditCard, DivideIcon as LucideIcon, Lock,Shield, User } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  path: string;
  icon: typeof LucideIcon;
}

export const tabs: Tab[] = [
  {
    id: 'account-security',
    label: 'Account & Security',
    path: '/account/',
    icon: Shield,
  },
  {
    id: 'edit-profile',
    label: 'Edit Profile',
    path: '/account/edit-profile',
    icon: User,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/account/notifications',
    icon: Bell,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    path: '/account/privacy',
    icon: Lock,
  },
  {
    id: 'billing',
    label: 'Billing',
    path: '/account/billing',
    icon: CreditCard,
  },
];

export function getTabIdFromPath(path: string): string {
  const tab = tabs.find((tab) => tab.path === path);
  return tab ? tab.id : '';
}