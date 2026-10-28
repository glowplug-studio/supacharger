import { createClient } from '@/lib/supabase/server';
import { authoriseImageUpload } from '@/supacharger/media/authorise-image-upload';


export async function POST(request: Request) {
  // Cookie-authenticated browser requests must originate from this application.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous) return Response.json({ error: 'Sign in to upload images.' }, { status: 401 });
  if (!process.env.IMAGE_UPLOAD_SIGNING_SECRET || process.env.IMAGE_UPLOAD_SIGNING_SECRET.length < 32) {
    return Response.json({ error: 'Image uploads are not configured.' }, { status: 503 });
  }
  try {
    // Metadata only; image bytes go directly to Edge and never through Vercel.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'Invalid request.' }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) { await reader.cancel(); return Response.json({ error: 'Request too large.' }, { status: 413 }); }
      chunks.push(value);
    }
    const body = await new Blob(chunks.map(chunk => new Uint8Array(chunk))).text();
    const result = await authoriseImageUpload(JSON.parse(body), user.id);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Invalid image upload request.' }, { status: 400 });
  }
}
