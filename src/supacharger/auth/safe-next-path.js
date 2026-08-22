/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function getSafeNextPath(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\u0000-\u001f\u007f]/.test(path)) {
    return null;
  }

  try {
    const decodedPath = decodeURIComponent(path);
    if (decodedPath.startsWith('//') || decodedPath.includes('\\')) {
      return null;
    }

    const parsed = new URL(path, 'https://supacharger.invalid');
    if (parsed.origin !== 'https://supacharger.invalid') {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/**
 * @param {string} pathname
 * @param {string | null} nextPath
 */
export function withNextPath(pathname, nextPath) {
  if (!nextPath) {
    return pathname;
  }

  const separator = pathname.includes('?') ? '&' : '?';
  return `${pathname}${separator}next=${encodeURIComponent(nextPath)}`;
}
