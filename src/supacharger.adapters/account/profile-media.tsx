import { AccountProfileMediaWidget } from '@/components/sc_widgets/profile/account-profile-media-widget';
import type { AccountProfileMediaProps } from '@/supacharger/account/settings/account-settings-contract';

/** Project-owned presentation for the managed account media contract. */
export function AccountProfileMedia(props: AccountProfileMediaProps) {
  return <AccountProfileMediaWidget {...props} />;
}
