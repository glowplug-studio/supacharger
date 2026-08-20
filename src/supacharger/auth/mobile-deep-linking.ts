import type { SupachargerConfig } from '../supacharger-config-contract';

type MobileDeepLinkingConfig = SupachargerConfig['MOBILE_DEEP_LINKING'];

const appleAppIdPattern = /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/;
const androidPackagePattern = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/;
const sha256FingerprintPattern = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/;

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function validateAssociatedPaths(paths: readonly string[]) {
  if (paths.length === 0) {
    throw new Error('MOBILE_DEEP_LINKING.ASSOCIATED_PATHS must contain at least one path when enabled.');
  }

  for (const path of paths) {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new Error(`Invalid mobile deep-link path: ${path}`);
    }
  }
}

export function createAppleAppSiteAssociation(config: MobileDeepLinkingConfig) {
  if (!config.ENABLED || config.IOS.APP_IDS.length === 0) return null;

  validateAssociatedPaths(config.ASSOCIATED_PATHS);
  const appIDs = unique(config.IOS.APP_IDS);
  for (const appID of appIDs) {
    if (!appleAppIdPattern.test(appID)) {
      throw new Error(`Invalid Apple application identifier: ${appID}`);
    }
  }

  return {
    applinks: {
      details: [
        {
          appIDs,
          components: unique(config.ASSOCIATED_PATHS).map((path) => ({ '/': path })),
        },
      ],
    },
  };
}

export function createAndroidAssetLinks(config: MobileDeepLinkingConfig) {
  if (!config.ENABLED || config.ANDROID.APPS.length === 0) return null;

  validateAssociatedPaths(config.ASSOCIATED_PATHS);

  return config.ANDROID.APPS.map((app) => {
    if (!androidPackagePattern.test(app.PACKAGE_NAME)) {
      throw new Error(`Invalid Android package name: ${app.PACKAGE_NAME}`);
    }

    const fingerprints = unique(app.SHA256_CERT_FINGERPRINTS);
    if (fingerprints.length === 0 || fingerprints.some((value) => !sha256FingerprintPattern.test(value))) {
      throw new Error(`Invalid Android SHA-256 signing fingerprint for ${app.PACKAGE_NAME}.`);
    }

    return {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: app.PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints,
      },
    };
  });
}

export function associationDocumentResponse(document: object | null) {
  if (!document) {
    return new Response(null, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return new Response(JSON.stringify(document), {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
