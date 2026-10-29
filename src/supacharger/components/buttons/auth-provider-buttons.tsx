import type { ComponentType, SVGProps } from 'react';

import { signInWithOAuth } from '@/lib/supabase/supacharger/supabase-auth';
import AppleLogo from '@/supacharger/assets/svgr/auth-providers/apple-icon.svg';
import BitbucketLogo from '@/supacharger/assets/svgr/auth-providers/bitbucket-icon.svg';
import DiscordLogo from '@/supacharger/assets/svgr/auth-providers/discord-icon.svg';
import FacebookLogo from '@/supacharger/assets/svgr/auth-providers/facebook-icon.svg';
import FigmaLogo from '@/supacharger/assets/svgr/auth-providers/figma-icon.svg';
import GitHubLogo from '@/supacharger/assets/svgr/auth-providers/github-icon.svg';
import GitLabLogo from '@/supacharger/assets/svgr/auth-providers/gitlab-icon.svg';
import GoogleLogo from '@/supacharger/assets/svgr/auth-providers/google-icon.svg';
import KakaoLogo from '@/supacharger/assets/svgr/auth-providers/kakao-icon.svg';
import KeycloakLogo from '@/supacharger/assets/svgr/auth-providers/keycloak-icon.svg';
import LinkedInLogo from '@/supacharger/assets/svgr/auth-providers/linkedin-icon.svg';
import MicrosoftLogo from '@/supacharger/assets/svgr/auth-providers/microsoft-icon.svg';
import NotionLogo from '@/supacharger/assets/svgr/auth-providers/notion-icon.svg';
import SlackLogo from '@/supacharger/assets/svgr/auth-providers/slack-icon.svg';
import SpotifyLogo from '@/supacharger/assets/svgr/auth-providers/spotify-icon.svg';
import TwitchLogo from '@/supacharger/assets/svgr/auth-providers/twitch-icon.svg';
import TwitterLogo from '@/supacharger/assets/svgr/auth-providers/twitter-icon.svg';
import WorkOSLogo from '@/supacharger/assets/svgr/auth-providers/workos-icon.svg';
import XLogo from '@/supacharger/assets/svgr/auth-providers/x-icon.svg';
import ZoomLogo from '@/supacharger/assets/svgr/auth-providers/zoom-icon.svg';
import { Button } from '@/supacharger/components/primitives/button';
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
  return providers.filter((provider) => SC_CONFIG.SUPABASE_AUTH.OAUTH_PROVIDERS[provider.key]);
}

export function EnabledAuthProviderIcons({ limit = 3 }: { limit?: number }) {
  const enabledProviders = getEnabledProviders().slice(0, limit);

  if (enabledProviders.length === 0) return null;

  return (
    <span className='sc-auth-provider-stack' aria-hidden='true'>
      {enabledProviders.map(({ key, Logo }) => (
        <span className='sc-auth-provider-avatar' key={key}>
          <Logo className='sc-auth-provider-logo' focusable='false' />
        </span>
      ))}
    </span>
  );
}

export default function AuthProviderButtons({
  termsAccepted = false,
  disabled = false,
}: {
  termsAccepted?: boolean;
  disabled?: boolean;
}) {
  const enabledProviders = getEnabledProviders();

  if (enabledProviders.length === 0) return null;

  return (
    <div className='sc-auth-provider-list'>
      {enabledProviders.map(({ key, label, Logo }) => (
        <Button
          type='button'
          variant='ghost'
          className='sc-auth-surface-button sc-auth-provider-button'
          key={key}
          disabled={disabled}
          onClick={() => void signInWithOAuth(key, termsAccepted)}
        >
          <span className='sc-auth-provider-avatar'>
            <Logo className='sc-auth-provider-logo' aria-hidden='true' focusable='false' />
          </span>
          <span className='sc-auth-provider-label'>{label}</span>
          <span aria-hidden='true' />
        </Button>
      ))}
    </div>
  );
}
