import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTH_CONFIRMATION_NOTICE_PARAM,
  resolveAuthConfirmationRedirect,
} from '../src/supacharger/auth/confirmation-redirect.ts';

const requestUrl =
  'https://app.example.com/auth/confirm?token_hash=secret&type=signup&next=%2Fevents%3Ffilter%3Dmine';

test('a valid confirmation continues to the safe requested destination without secrets', () => {
  const redirect = resolveAuthConfirmationRedirect({
    requestUrl,
    requestedNext: '/events?filter=mine',
    fallbackNext: '/?account_confirmed=1',
    loginPath: '/account/login',
    outcome: 'verified',
  });

  assert.equal(redirect.toString(), 'https://app.example.com/events?filter=mine');
});

test('a consumed link with a confirmed session continues to the app with a notice', () => {
  const redirect = resolveAuthConfirmationRedirect({
    requestUrl,
    requestedNext: null,
    fallbackNext: '/?account_confirmed=1',
    loginPath: '/account/login',
    outcome: 'already-authenticated',
  });

  assert.equal(redirect.pathname, '/');
  assert.equal(redirect.searchParams.get('account_confirmed'), null);
  assert.equal(redirect.searchParams.get(AUTH_CONFIRMATION_NOTICE_PARAM), 'already-signed-in');
  assert.equal(redirect.searchParams.get('token_hash'), null);
  assert.equal(redirect.searchParams.get('type'), null);
});

test('a consumed or invalid link without a session goes to login with a safe notice', () => {
  const redirect = resolveAuthConfirmationRedirect({
    requestUrl,
    requestedNext: '/events',
    fallbackNext: '/?account_confirmed=1',
    loginPath: '/account/login',
    outcome: 'invalid',
  });

  assert.equal(redirect.pathname, '/account/login');
  assert.equal(redirect.searchParams.get(AUTH_CONFIRMATION_NOTICE_PARAM), 'sign-in');
  assert.equal(redirect.searchParams.get('next'), null);
});

test('an unsafe requested destination falls back to the configured internal path', () => {
  const redirect = resolveAuthConfirmationRedirect({
    requestUrl,
    requestedNext: '//attacker.example/path',
    fallbackNext: '/?account_confirmed=1',
    loginPath: '/account/login',
    outcome: 'verified',
  });

  assert.equal(redirect.toString(), 'https://app.example.com/?account_confirmed=1');
});
