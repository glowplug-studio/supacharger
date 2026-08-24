import type { AccountNavigationExtension, AccountNavigationItem } from '@/supacharger/account/settings/account-settings-contract';

export const accountNavigationExtensions: AccountNavigationExtension[] = [];

/** Developer-owned ordering, relabelling and extension seam. */
export function resolveAccountNavigation(baseItems: AccountNavigationItem[]): AccountNavigationItem[] {
  return [...baseItems, ...accountNavigationExtensions].sort((left, right) => left.order - right.order);
}
