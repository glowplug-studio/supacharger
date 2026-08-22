import assert from 'node:assert/strict';
import test from 'node:test';

import { hasVerifiedSessionForEmail } from '../src/supacharger/auth/otp-verification.ts';

test('a confirmed authenticated user matching the submitted email is already verified', () => {
  assert.equal(
    hasVerifiedSessionForEmail(
      {
        email: 'Person@Example.com',
        email_confirmed_at: '2026-08-21T04:18:59.653341Z',
      },
      ' person@example.com ',
    ),
    true,
  );
});

test('the canonical confirmed_at field also identifies an already verified user', () => {
  assert.equal(
    hasVerifiedSessionForEmail(
      {
        email: 'person@example.com',
        confirmed_at: '2026-08-21T04:18:59.653341Z',
      },
      'person@example.com',
    ),
    true,
  );
});

test('a different, missing, or unconfirmed session does not mask an invalid OTP', () => {
  assert.equal(
    hasVerifiedSessionForEmail(
      { email: 'other@example.com', email_confirmed_at: '2026-08-21T04:18:59.653341Z' },
      'person@example.com',
    ),
    false,
  );
  assert.equal(
    hasVerifiedSessionForEmail({ email: 'person@example.com', email_confirmed_at: null }, 'person@example.com'),
    false,
  );
  assert.equal(hasVerifiedSessionForEmail(null, 'person@example.com'), false);
});
