const SITE_URL_ENVIRONMENT_VARIABLE = 'NEXT_PUBLIC_SITE_URL';

/** Return the configured canonical application URL without a trailing slash. */
export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    throw new ReferenceError(
      `Reference to undefined or empty env var: ${SITE_URL_ENVIRONMENT_VARIABLE}`,
    );
  }

  const urlWithProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`;
  const parsedUrl = new URL(urlWithProtocol);

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new TypeError(`${SITE_URL_ENVIRONMENT_VARIABLE} must use http or https`);
  }

  return parsedUrl.toString().replace(/\/+$/, '');
}

/** Append an application-relative path to the configured canonical site URL. */
export function getURL(path = ''): string {
  const cleanPath = path.replace(/^\/+/, '');
  const siteUrl = getSiteUrl();
  return cleanPath ? `${siteUrl}/${cleanPath}` : siteUrl;
}
