/// <reference lib="deno.ns" />
import { createClient } from 'npm:@supabase/supabase-js@2.99.2';
import { z } from 'npm:zod@4.4.3';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const querySchema = z.object({
  path: z.string().max(512).regex(/^[0-9a-f-]{36}\/(?:avatar-[A-Za-z0-9_-]+|headers\/header-[A-Za-z0-9_-]+)\.(?:webp|png|jpe?g|avif)$/i),
}).strict();
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers });
  const params = new URL(request.url).searchParams;
  const query = querySchema.safeParse(Object.fromEntries(params));
  if (!query.success || params.getAll('path').length !== 1) return new Response(null, { status: 400, headers });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return new Response(null, { status: 503, headers });
  const authorization = request.headers.get('Authorization');
  // No service credentials: Storage evaluates the caller's JWT or anonymous RLS.
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: authorization ? { Authorization: authorization } : {} },
  });
  const { data, error } = await client.storage.from('user-avatars').download(query.data.path);
  if (error || !data) return new Response(null, { status: 404, headers });
  if (!['image/webp', 'image/png', 'image/jpeg', 'image/avif'].includes(data.type)) {
    return new Response(null, { status: 404, headers });
  }
  return new Response(request.method === 'HEAD' ? null : data, {
    headers: { ...headers, 'Content-Type': data.type, 'Content-Length': String(data.size) },
  });
});
