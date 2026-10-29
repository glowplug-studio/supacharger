/** Shared Web Crypto implementation; no application settings or secrets are bundled here. */
async function signingKey(secret: string) {
  if (secret.length < 32) throw new Error('Image upload signing secret is not configured.');
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signImagePermit(payload: string, secret: string) {
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyImagePermit(payload: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/../g)!, byte => parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await signingKey(secret), bytes, new TextEncoder().encode(payload));
}

export async function imageSha256(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
