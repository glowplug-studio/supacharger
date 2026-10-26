import { KeyRound, Mail } from 'lucide-react';

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
import PhoneLogo from '@/supacharger/assets/svgr/auth-providers/phone-icon4.svg';
import SamlLogo from '@/supacharger/assets/svgr/auth-providers/saml-icon.svg';
import SlackLogo from '@/supacharger/assets/svgr/auth-providers/slack-icon.svg';
import SpotifyLogo from '@/supacharger/assets/svgr/auth-providers/spotify-icon.svg';
import TwitchLogo from '@/supacharger/assets/svgr/auth-providers/twitch-icon.svg';
import TwitterLogo from '@/supacharger/assets/svgr/auth-providers/twitter-icon.svg';
import Web3Logo from '@/supacharger/assets/svgr/auth-providers/web3-icon.svg';
import WorkOSLogo from '@/supacharger/assets/svgr/auth-providers/workos-icon.svg';
import XLogo from '@/supacharger/assets/svgr/auth-providers/x-icon.svg';
import ZoomLogo from '@/supacharger/assets/svgr/auth-providers/zoom-icon.svg';

type IconProps = import('react').SVGProps<SVGSVGElement>;
type IconComponent = import('react').ComponentType<IconProps>;

// Accept identity keys and the existing account screens' formatted provider labels.
function normaliseProvider(provider: string) {
  return provider.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const providerIcons: Record<string, IconComponent> = {
  apple: AppleLogo,
  azure: MicrosoftLogo,
  bitbucket: BitbucketLogo,
  discord: DiscordLogo,
  email: Mail,
  emailandpassword: Mail,
  emailpassword: Mail,
  ethereum: Web3Logo,
  facebook: FacebookLogo,
  figma: FigmaLogo,
  github: GitHubLogo,
  gitlab: GitLabLogo,
  google: GoogleLogo,
  kakao: KakaoLogo,
  keycloak: KeycloakLogo,
  linkedin: LinkedInLogo,
  linkedinoidc: LinkedInLogo,
  microsoft: MicrosoftLogo,
  notion: NotionLogo,
  phone: PhoneLogo,
  saml: SamlLogo,
  slack: SlackLogo,
  slackdeprecated: SlackLogo,
  slackoidc: SlackLogo,
  solana: Web3Logo,
  spotify: SpotifyLogo,
  sso: SamlLogo,
  twitch: TwitchLogo,
  twitter: TwitterLogo,
  twitterdeprecated: TwitterLogo,
  web3: Web3Logo,
  workos: WorkOSLogo,
  x: XLogo,
  xtwitteroauth20: XLogo,
  zoom: ZoomLogo,
};

export function AuthProviderIcon({ provider, ...props }: IconProps & { provider: string }) {
  const key = normaliseProvider(provider);
  const Icon = providerIcons[key] ?? (provider.toLowerCase().startsWith('sso:') ? SamlLogo : KeyRound);
  return <Icon {...props} aria-hidden='true' focusable='false' />;
}
