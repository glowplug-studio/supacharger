/** Missing or untranslated values use the English source at runtime. */
export function withEnglishFallback<T extends object>(english: T, translated: object): T {
  const result: Record<string, unknown> = { ...(english as Record<string, unknown>), ...(translated as Record<string, unknown>) };
  const values = translated as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(english)) {
    const value = values[key];
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
      result[key] = withEnglishFallback(
        fallback,
        value && typeof value === 'object' && !Array.isArray(value) ? value : {},
      );
    } else if (value === undefined || (typeof value === 'string' && !value.trim())) {
      result[key] = fallback;
    }
  }
  return result as T;
}
