export type ImageUploadProgress =
  | { phase: 'preparing' | 'processing' | 'completed' }
  | { phase: 'uploading'; loaded: number; total?: number; percent?: number };

type ProgressCallback = (progress: ImageUploadProgress) => void;
const uploads = new WeakMap<FormData, ProgressCallback>();

export function trackImageUpload(body: FormData, onProgress: ProgressCallback) {
  uploads.set(body, onProgress);
  return () => uploads.delete(body);
}

// Supabase applies its session, API key and request headers before this transport.
// Other SDK requests retain the normal fetch implementation.
export const imageUploadFetch: typeof fetch = (input, init) => {
  const body = init?.body;
  const onProgress = body instanceof FormData ? uploads.get(body) : undefined;
  if (!onProgress) return fetch(input, init);

  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const signal = init?.signal;
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const abort = () => xhr.abort();
    if (signal?.aborted) {
      reject(new DOMException('The upload was aborted.', 'AbortError'));
      return;
    }
    xhr.upload.onprogress = (event) => onProgress({
      phase: 'uploading', loaded: event.loaded,
      ...(event.lengthComputable && event.total > 0
        ? { total: event.total, percent: Math.min(100, event.loaded / event.total * 100) }
        : {}),
    });
    xhr.upload.onload = () => onProgress({ phase: 'processing' });
    xhr.onload = () => {
      cleanup();
      const headers = new Headers();
      xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach((line) => {
        const colon = line.indexOf(':');
        if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
      });
      resolve(new Response([204, 205, 304].includes(xhr.status) ? null : xhr.responseText, {
        status: xhr.status, statusText: xhr.statusText, headers,
      }));
    };
    xhr.onerror = () => { cleanup(); reject(new TypeError('The image upload failed.')); };
    xhr.onabort = () => { cleanup(); reject(new DOMException('The upload was aborted.', 'AbortError')); };
    xhr.ontimeout = () => { cleanup(); reject(new TypeError('The image upload timed out.')); };
    try {
      xhr.open(init?.method ?? 'POST', typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      new Headers(init?.headers).forEach((value, name) => xhr.setRequestHeader(name, value));
      xhr.withCredentials = init?.credentials === 'include';
      signal?.addEventListener('abort', abort, { once: true });
      onProgress({ phase: 'uploading', loaded: 0 });
      xhr.send(body as FormData);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};
