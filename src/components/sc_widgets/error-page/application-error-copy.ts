export type ApplicationErrorKind = 'notFound' | 'unexpected';

export type ApplicationErrorCopy = {
  status: string;
  title: string;
  description: string;
  goHome: string;
  contactSupport: string;
};

const FALLBACK_COPY: Record<ApplicationErrorKind, ApplicationErrorCopy> = {
  notFound: {
    status: '404 error',
    title: 'Page not found',
    description: 'Sorry, we couldn’t find the page you’re looking for.',
    goHome: 'Go home',
    contactSupport: 'Contact support',
  },
  unexpected: {
    status: 'Something went wrong',
    title: 'We couldn’t load this page',
    description:
      'The page ran into a problem. Try again from the home page, or contact support if it keeps happening.',
    goHome: 'Go home',
    contactSupport: 'Contact support',
  },
};

function isMessageRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function messageOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function resolveApplicationErrorCopy(
  messages: unknown,
  kind: ApplicationErrorKind,
): ApplicationErrorCopy {
  const fallback = FALLBACK_COPY[kind];
  const rootMessages = isMessageRecord(messages) ? messages : {};
  const errorMessages = isMessageRecord(rootMessages.ErrorPage) ? rootMessages.ErrorPage : {};
  const kindMessages = isMessageRecord(errorMessages[kind]) ? errorMessages[kind] : {};

  return {
    status: messageOrFallback(kindMessages.status, fallback.status),
    title: messageOrFallback(kindMessages.title, fallback.title),
    description: messageOrFallback(kindMessages.description, fallback.description),
    goHome: messageOrFallback(errorMessages.goHome, fallback.goHome),
    contactSupport: messageOrFallback(errorMessages.contactSupport, fallback.contactSupport),
  };
}
