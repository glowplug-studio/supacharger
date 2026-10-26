import { z } from 'zod';

// Only provider-operated image hosts. Never fetch arbitrary identity metadata URLs.
const providerHosts: Record<string, readonly string[]> = {
  google: ['googleusercontent.com'],
  facebook: ['graph.facebook.com', 'platform-lookaside.fbsbx.com', 'fbcdn.net'],
  github: ['avatars.githubusercontent.com'],
  gitlab: ['gitlab.com', 'gravatar.com'],
  bitbucket: ['bitbucket.org', 'gravatar.com'],
  discord: ['cdn.discordapp.com'],
  twitter: ['pbs.twimg.com'],
  linkedin: ['media.licdn.com'],
  linkedin_oidc: ['media.licdn.com'],
  slack: ['avatars.slack-edge.com', 'secure.gravatar.com'],
  spotify: ['i.scdn.co'],
  twitch: ['static-cdn.jtvnw.net'],
};

export const socialAvatarSourceSchema = z.object({
  provider: z.string().min(1).max(100),
  avatar_url: z.string().min(1).max(2048),
});

export function allowedSocialAvatarUrl(provider: string, value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || value.length > 2048) return null;
    const hosts = providerHosts[provider] ?? [];
    return hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url : null;
  } catch {
    return null;
  }
}

export async function downloadSocialAvatar(provider: string, source: string): Promise<File> {
  let url = allowedSocialAvatarUrl(provider, source);
  const signal = AbortSignal.timeout(8000);
  const maxBytes = 5 * 1024 * 1024;
  for (let redirects = 0; redirects <= 3 && url; redirects++) {
    const response = await fetch(url, { signal, redirect: 'manual', cache: 'no-store' });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      url = location ? allowedSocialAvatarUrl(provider, new URL(location, url).href) : null;
      continue;
    }
    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!response.ok || !response.body || !['image/jpeg', 'image/png', 'image/webp'].includes(type ?? '')
      || Number(response.headers.get('content-length')) > maxBytes) {
      await response.body?.cancel();
      throw new Error('Unsupported social avatar response');
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) throw new Error('Social avatar too large');
        chunks.push(new Uint8Array(value));
      }
    } finally {
      await reader.cancel();
    }
    if (!bytes) throw new Error('Empty social avatar');
    // The existing image processor decodes, validates and re-encodes these bytes.
    return new File(chunks, 'social-avatar', { type });
  }
  throw new Error('Unsupported social avatar source');
}
