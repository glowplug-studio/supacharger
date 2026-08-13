/** Convert Stripe's Unix timestamps (seconds since epoch) without applying a timezone offset. */
export function stripeUnixToDate(seconds: number): Date {
  if (!Number.isFinite(seconds)) {
    throw new TypeError('Stripe timestamp must be a finite number of seconds.');
  }

  return new Date(seconds * 1000);
}
