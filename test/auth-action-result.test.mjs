import assert from 'node:assert/strict';
import test from 'node:test';

import {
  authActionFailure,
  authActionSuccess,
} from '../src/supacharger/auth/auth-action-result.ts';

class FakeAuthError extends Error {
  constructor(code, status) {
    super('Internal provider detail that must not cross the action boundary');
    this.code = code;
    this.status = status;
  }
}

test('auth failures cross the Server Action boundary as plain safe data', () => {
  const result = authActionFailure(new FakeAuthError('over_email_send_rate_limit', 429));

  assert.deepEqual(result, {
    data: null,
    error: {
      code: 'over_email_send_rate_limit',
      status: 429,
    },
  });
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.getPrototypeOf(result.error), Object.prototype);
  assert.doesNotThrow(() => structuredClone(result));
  assert.doesNotMatch(JSON.stringify(result), /Internal provider detail/);
});

test('unknown failures use the supplied safe fallback code', () => {
  assert.deepEqual(authActionFailure(new Error('private detail'), 'email_send_failed'), {
    data: null,
    error: {
      code: 'email_send_failed',
      status: null,
    },
  });
});

test('auth successes expose only the explicitly selected data', () => {
  assert.deepEqual(authActionSuccess({ userId: 'user-id', identityCount: 1 }), {
    data: { userId: 'user-id', identityCount: 1 },
    error: null,
  });
});
