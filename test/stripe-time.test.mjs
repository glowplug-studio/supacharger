import assert from 'node:assert/strict';
import test from 'node:test';

import { stripeUnixToDate } from '../src/lib/stripe/stripe-time.ts';

test('converts a Stripe Unix timestamp without adding an offset', () => {
  assert.equal(stripeUnixToDate(1_774_992_000).toISOString(), '2026-03-31T21:20:00.000Z');
});

test('converts the Unix epoch exactly', () => {
  assert.equal(stripeUnixToDate(0).toISOString(), '1970-01-01T00:00:00.000Z');
});

test('rejects non-finite Stripe timestamps', () => {
  assert.throws(() => stripeUnixToDate(Number.NaN), /finite number/);
});
