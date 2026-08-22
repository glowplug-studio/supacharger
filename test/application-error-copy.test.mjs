import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveApplicationErrorCopy } from '../src/components/error-page/application-error-copy.ts';

test('uses protected English copy when the ErrorPage namespace is absent', () => {
  assert.deepEqual(resolveApplicationErrorCopy({}, 'notFound'), {
    status: '404 error',
    title: 'Page not found',
    description: 'Sorry, we couldn’t find the page you’re looking for.',
    goHome: 'Go home',
    contactSupport: 'Contact support',
  });
});

test('uses localised copy and falls back only for missing fields', () => {
  assert.deepEqual(
    resolveApplicationErrorCopy(
      {
        ErrorPage: {
          notFound: {
            status: 'Erreur 404',
            title: 'Page introuvable',
            description: 'Description traduite',
          },
          goHome: 'Retour à l’accueil',
        },
      },
      'notFound',
    ),
    {
      status: 'Erreur 404',
      title: 'Page introuvable',
      description: 'Description traduite',
      goHome: 'Retour à l’accueil',
      contactSupport: 'Contact support',
    },
  );
});
