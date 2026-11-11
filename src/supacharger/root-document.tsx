import type { Metadata, Viewport } from 'next';

import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

type SocialImage = {
  URL: string;
  ALT: string;
  WIDTH: number;
  HEIGHT: number;
};

export type SupachargerRootDocumentConfig = {
  SITE_TITLE: string;
  SITE_DESCRIPTION: string;
  METADATA: {
    SITE_URL: string;
    INDEXING_ENABLED: boolean;
    FAVICON_SET_ENABLED: boolean;
    DEFAULT_OG_IMAGE: { DEFAULT: SocialImage | null; LOCALES: Readonly<Record<string, SocialImage>> };
    COLOR_SCHEME: 'normal' | 'light' | 'dark' | 'light dark';
    THEME_COLOR:
      | string
      | {
          LIGHT: string;
          DARK: string;
        }
      | null;
  };
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: string | null;
    VERCEL_ANALYTICS_ENABLED: boolean;
  };
};

export type SupachargerPageMetadata = {
  title: string;
  description?: string;
  canonicalPath?: string;
  socialImage?: SocialImage | null;
};

const faviconMetadata: Pick<Metadata, 'icons' | 'manifest'> = {
  manifest: '/favicons/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicons/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicons/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/favicons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

function createSocialImages(image: SocialImage | null) {
  if (!image) return [];

  return [
    {
      url: image.URL,
      alt: image.ALT,
      width: image.WIDTH,
      height: image.HEIGHT,
    },
  ];
}

function formatPageTitle(title: string, template: string) {
  return template.includes('%s') ? template.replace('%s', title) : title;
}

export function createSupachargerMetadata(config: SupachargerRootDocumentConfig, locale = 'en'): Metadata {
  const socialImages = createSocialImages(
    config.METADATA.DEFAULT_OG_IMAGE.LOCALES[locale] ?? config.METADATA.DEFAULT_OG_IMAGE.DEFAULT,
  );

  return {
    metadataBase: new URL(config.METADATA.SITE_URL),
    applicationName: config.SITE_TITLE,
    title: {
      default: config.SITE_TITLE,
      template: `%s | ${config.SITE_TITLE}`,
    },
    description: config.SITE_DESCRIPTION,
    openGraph: {
      type: 'website',
      siteName: config.SITE_TITLE,
      title: config.SITE_TITLE,
      description: config.SITE_DESCRIPTION,
      images: socialImages,
    },
    twitter: {
      card: socialImages.length ? 'summary_large_image' : 'summary',
      title: config.SITE_TITLE,
      description: config.SITE_DESCRIPTION,
      images: socialImages,
    },
    robots: config.METADATA.INDEXING_ENABLED
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : {
          index: false,
          follow: false,
        },
    ...(config.METADATA.FAVICON_SET_ENABLED ? faviconMetadata : {}),
  };
}

export function createSupachargerPageMetadata(
  config: SupachargerRootDocumentConfig,
  page: SupachargerPageMetadata,
  locale = 'en',
): Metadata {
  const description = page.description ?? config.SITE_DESCRIPTION;
  const socialImage =
    page.socialImage === undefined
      ? (config.METADATA.DEFAULT_OG_IMAGE.LOCALES[locale] ?? config.METADATA.DEFAULT_OG_IMAGE.DEFAULT)
      : page.socialImage;
  const socialImages = createSocialImages(socialImage);
  const socialTitle = formatPageTitle(page.title, `%s | ${config.SITE_TITLE}`);

  return {
    title: page.title,
    description,
    alternates: page.canonicalPath
      ? {
          canonical: page.canonicalPath,
        }
      : undefined,
    openGraph: {
      type: 'website',
      siteName: config.SITE_TITLE,
      title: socialTitle,
      description,
      url: page.canonicalPath,
      images: socialImages,
    },
    twitter: {
      card: socialImages.length ? 'summary_large_image' : 'summary',
      title: socialTitle,
      description,
      images: socialImages,
    },
  };
}

export function createSupachargerViewport(config: SupachargerRootDocumentConfig): Viewport {
  const configuredThemeColor = config.METADATA.THEME_COLOR;
  const themeColor =
    configuredThemeColor && typeof configuredThemeColor !== 'string'
      ? [
          { media: '(prefers-color-scheme: light)', color: configuredThemeColor.LIGHT },
          { media: '(prefers-color-scheme: dark)', color: configuredThemeColor.DARK },
        ]
      : (configuredThemeColor ?? undefined);

  return {
    colorScheme: config.METADATA.COLOR_SCHEME,
    themeColor,
  };
}

export function SupachargerAnalytics({ config }: { config: SupachargerRootDocumentConfig }) {
  const googleAnalyticsId = config.ANALYTICS.GOOGLE_ANALYTICS_ID?.trim();

  return (
    <>
      {config.ANALYTICS.VERCEL_ANALYTICS_ENABLED ? <VercelAnalytics /> : null}
      {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
    </>
  );
}
