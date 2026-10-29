import type { Database } from '@/supacharger/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SignedMediaRequest = {
  key: string;
  bucket: string;
  path: string | null | undefined;
};

export async function resolveSignedMediaUrls(
  supabase: SupabaseClient<Database>,
  requests: SignedMediaRequest[],
  expiresIn = 60 * 60,
) {
  const resolved: Record<string, string | null> = Object.fromEntries(requests.map(({ key }) => [key, null]));
  const requestsByBucket = Map.groupBy(
    requests.filter((request): request is SignedMediaRequest & { path: string } => Boolean(request.path)),
    ({ bucket }) => bucket,
  );

  await Promise.all(
    [...requestsByBucket].map(async ([bucket, bucketRequests]) => {
      const paths = [...new Set(bucketRequests.map(({ path }) => path))];
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
      if (error) return;

      const urlsByPath = new Map(data.map((item) => [item.path, item.signedUrl]));
      for (const request of bucketRequests) resolved[request.key] = urlsByPath.get(request.path) ?? null;
    }),
  );

  return resolved;
}
