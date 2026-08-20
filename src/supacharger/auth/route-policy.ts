const routePatternCache = new Map<string, RegExp>();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
}

function compileRoutePattern(pattern: string) {
  const cached = routePatternCache.get(pattern);
  if (cached) return cached;

  if (!pattern.startsWith('/')) {
    throw new Error(`Supacharger route patterns must start with "/": ${pattern}`);
  }

  if (pattern === '/') {
    const rootPattern = /^\/$/;
    routePatternCache.set(pattern, rootPattern);
    return rootPattern;
  }

  const segments = pattern.slice(1).split('/');
  let source = '^';

  segments.forEach((segment) => {
    if (/^:[A-Za-z_][A-Za-z0-9_]*\*$/.test(segment)) {
      source += '(?:/.*)?';
    } else if (/^:[A-Za-z_][A-Za-z0-9_]*$/.test(segment)) {
      source += '/[^/]+';
    } else {
      source += `/${escapeRegExp(segment)}`;
    }
  });

  const compiled = new RegExp(`${source}$`);
  routePatternCache.set(pattern, compiled);
  return compiled;
}

export function pathMatches(pathname: string, patterns: readonly string[]) {
  return patterns.some((pattern) => compileRoutePattern(pattern).test(pathname));
}

