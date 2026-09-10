import { createHash } from 'node:crypto';
import { z } from 'zod';

const refreshBody = z.object({ refresh_token: z.string().min(1).max(8192) }).strict();
const MAX_ENTRIES = 256;
const MAX_IN_FLIGHT = 8;
const MAX_STARTS_PER_MINUTE = 60;
const REPLAY_MS = 10_000;
const FAILURE_MS = 30_000;
const TIMEOUT_MS = 5_000;

type Snapshot = { body: string; status: number; headers: [string, string][]; temporary: boolean };
type Entry = { expires: number; result: Promise<Snapshot> };

const busy = (): Snapshot => ({
  body: JSON.stringify({ error_code: 'refresh_temporarily_unavailable', message: 'Authentication temporarily unavailable' }),
  // A local 409 prevents auth-js's nested 5xx retry loop. The application exposes 503.
  status: 409,
  headers: [['content-type', 'application/json'], ['retry-after', '30']],
  temporary: true,
});

/** Bounded, best-effort protection for one runtime; never a shared authenticated client. */
export function createRefreshCoordinator(now: () => number = Date.now) {
  const entries = new Map<string, Entry>();
  let active = 0;
  let starts: number[] = [];
  let unavailableUntil = 0;

  return async (key: string, perform: () => Promise<Response>): Promise<Snapshot> => {
    for (const [entryKey, entry] of entries) {
      if (entry.expires <= now()) entries.delete(entryKey);
    }
    const existing = entries.get(key);
    if (existing) return existing.result;
    starts = starts.filter((started) => started > now() - 60_000);
    if (now() < unavailableUntil || active >= MAX_IN_FLIGHT || starts.length >= MAX_STARTS_PER_MINUTE || entries.size >= MAX_ENTRIES) return busy();

    active += 1;
    starts.push(now());
    const entry: Entry = { expires: Infinity, result: Promise.resolve(busy()) };
    // Register before starting I/O so every caller for the same credential joins it.
    entries.set(key, entry);
    entry.result = (async () => {
      try {
        const response = await perform();
        if (response.status === 409 || response.status === 429 || response.status >= 500) {
          if (response.status !== 409) unavailableUntil = now() + FAILURE_MS;
          await response.body?.cancel();
          return busy();
        }
        const body = await response.text();
        if (body.length > 262144) return busy();
        return { body, status: response.status, headers: Array.from(response.headers.entries()), temporary: false };
      } catch {
        unavailableUntil = now() + FAILURE_MS;
        return busy();
      } finally {
        active -= 1;
      }
    })().then((result) => {
      entry.expires = now() + (result.temporary ? FAILURE_MS : REPLAY_MS);
      // Expire token-bearing successful responses even if this runtime receives no further traffic.
      const timer = setTimeout(() => {
        if (entries.get(key) === entry) entries.delete(key);
      }, result.temporary ? FAILURE_MS : REPLAY_MS);
      timer.unref?.();
      return result;
    });
    return entry.result;
  };
}

const coordinateRefresh = createRefreshCoordinator();

/** One transport per client; the failure marker must never cross request boundaries. */
export function createAuthTransport(supabaseUrl: string, upstream: typeof fetch = fetch, coordinate = coordinateRefresh) {
  let temporaryFailure = false;
  const tokenUrl = new URL('/auth/v1/token', supabaseUrl);
  const guardedFetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== tokenUrl.origin || url.pathname !== tokenUrl.pathname || url.searchParams.get('grant_type') !== 'refresh_token') {
      return upstream(input, init);
    }
    let parsed;
    try {
      parsed = refreshBody.safeParse(typeof init?.body === 'string' && init.body.length <= 16384 ? JSON.parse(init.body) : null);
    } catch {
      parsed = refreshBody.safeParse(null);
    }
    if (!parsed.success || init?.method?.toUpperCase() !== 'POST') {
      temporaryFailure = true;
      const result = busy();
      return new Response(result.body, { status: result.status, headers: result.headers });
    }
    const headers = new Headers(init.headers);
    const key = createHash('sha256').update(JSON.stringify([tokenUrl.href, headers.get('apikey'), parsed.data.refresh_token])).digest('hex');
    const result = await coordinate(key, () => upstream(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }));
    temporaryFailure ||= result.temporary;
    return new Response(result.body, { status: result.status, headers: result.headers });
  };
  return { fetch: guardedFetch, isTemporarilyUnavailable: () => temporaryFailure };
}
