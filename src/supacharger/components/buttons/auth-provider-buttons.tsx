import type { ComponentType, SVGProps } from 'react';

import AppleLogo from '@/assets/images/authProviderIcons/apple-icon.svg';
import BitbucketLogo from '@/assets/images/authProviderIcons/bitbucket-icon.svg';
import DiscordLogo from '@/assets/images/authProviderIcons/discord-icon.svg';
import FacebookLogo from '@/assets/images/authProviderIcons/facebook-icon.svg';
import FigmaLogo from '@/assets/images/authProviderIcons/figma-icon.svg';
import GitHubLogo from '@/assets/images/authProviderIcons/github-icon.svg';
import GitLabLogo from '@/assets/images/authProviderIcons/gitlab-icon.svg';
import GoogleLogo from '@/assets/images/authProviderIcons/google-icon.svg';
import KakaoLogo from '@/assets/images/authProviderIcons/kakao-icon.svg';
import KeycloakLogo from '@/assets/images/authProviderIcons/keycloak-icon.svg';
import LinkedInLogo from '@/assets/images/authProviderIcons/linkedin-icon.svg';
import MicrosoftLogo from '@/assets/images/authProviderIcons/microsoft-icon.svg';
import NotionLogo from '@/assets/images/authProviderIcons/notion-icon.svg';
import SlackLogo from '@/assets/images/authProviderIcons/slack-icon.svg';
import SpotifyLogo from '@/assets/images/authProviderIcons/spotify-icon.svg';
import TwitchLogo from '@/assets/images/authProviderIcons/twitch-icon.svg';
import TwitterLogo from '@/assets/images/authProviderIcons/twitter-icon.svg';
import WorkOSLogo from '@/assets/images/authProviderIcons/workos-icon.svg';
import XLogo from '@/assets/images/authProviderIcons/x-icon.svg';
import ZoomLogo from '@/assets/images/authProviderIcons/zoom-icon.svg';
import { Button } from '@/components/ui/button';
import { signInWithOAuth } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import type { SupachargerOAuthProvider } from '@/supacharger/supacharger-config-contract';

type AuthProviderDefinition = {
  key: SupachargerOAuthProvider;
  label: string;
  Logo: ComponentType<SVGProps<SVGSVGElement>>;
};

const providers = [
  { key: 'apple', label: 'Apple', Logo: AppleLogo },
  { key: 'azure', label: 'Azure', Logo: MicrosoftLogo },
  { key: 'bitbucket', label: 'Bitbucket', Logo: BitbucketLogo },
  { key: 'discord', label: 'Discord', Logo: DiscordLogo },
  { key: 'facebook', label: 'Facebook', Logo: FacebookLogo },
  { key: 'figma', label: 'Figma', Logo: FigmaLogo },
  { key: 'github', label: 'GitHub', Logo: GitHubLogo },
  { key: 'gitlab', label: 'GitLab', Logo: GitLabLogo },
  { key: 'google', label: 'Google', Logo: GoogleLogo },
  { key: 'kakao', label: 'Kakao', Logo: KakaoLogo },
  { key: 'keycloak', label: 'Keycloak', Logo: KeycloakLogo },
  { key: 'linkedin_oidc', label: 'LinkedIn (OIDC)', Logo: LinkedInLogo },
  { key: 'notion', label: 'Notion', Logo: NotionLogo },
  { key: 'twitch', label: 'Twitch', Logo: TwitchLogo },
  { key: 'x', label: 'X / Twitter (OAuth 2.0)', Logo: XLogo },
  { key: 'twitter', label: 'Twitter (Deprecated)', Logo: TwitterLogo },
  { key: 'slack_oidc', label: 'Slack (OIDC)', Logo: SlackLogo },
  { key: 'slack', label: 'Slack (Deprecated)', Logo: SlackLogo },
  { key: 'spotify', label: 'Spotify', Logo: SpotifyLogo },
  { key: 'workos', label: 'WorkOS', Logo: WorkOSLogo },
  { key: 'zoom', label: 'Zoom', Logo: ZoomLogo },
] satisfies readonly AuthProviderDefinition[];

function getEnabledProviders() {
  return providers.filter((provider) => SC_CONFIG.AUTH_PROVDERS_ENABLED[provider.key]);
}

export function EnabledAuthProviderIcons({ limit = 3 }: { limit?: number }) {
  const enabledProviders = getEnabledProviders().slice(0, limit);

  if (enabledProviders.length === 0) return null;

  return (
    <span className='flex -space-x-2' aria-hidden='true'>
      {enabledProviders.map(({ key, Logo }) => (
        <span
          className='relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-white p-1.5 shadow-sm'
          key={key}
        >
          <Logo className='h-full w-full' focusable='false' />
        </span>
      ))}
    </span>
  );
}

export default function AuthProviderButtons() {
  const enabledProviders = getEnabledProviders();

  if (enabledProviders.length === 0) return null;

  return (
    <div className='grid w-full grid-cols-1 gap-3'>
      {enabledProviders.map(({ key, label, Logo }) => (
        <Button
          type='button'
          variant='ghost'
          className='sc-auth-surface-button grid w-full grid-cols-[1.75rem_1fr_1.75rem]'
          key={key}
          onClick={() => void signInWithOAuth(key)}
        >
          <Logo className='h-5 w-5 justify-self-start' aria-hidden='true' focusable='false' />
          <span className='justify-self-center'>{label}</span>
          <span aria-hidden='true' />
        </Button>
      ))}
    </div>
  );
}
