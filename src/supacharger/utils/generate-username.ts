export interface UsernameWords {
  prefixes: readonly string[];
  suffixes: readonly string[];
}

/** Strip unsupported characters; underscores and hyphens are valid usernames. */
export function normaliseUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

/** Generate a candidate independently of authentication, configuration or storage. */
export function generateUsername(words: UsernameWords, random: () => number = Math.random): string {
  if (!words.prefixes.length || !words.suffixes.length) {
    throw new Error('Username word lists must not be empty.');
  }
  const pick = (values: readonly string[]) => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new Error('Random values must be between zero inclusive and one exclusive.');
    }
    return values[Math.floor(value * values.length)];
  };
  const candidate = normaliseUsername(pick(words.prefixes) + pick(words.suffixes));
  if (candidate.length < 3 || candidate.length > 40) {
    throw new Error('Generated usernames must contain between 3 and 40 supported characters.');
  }
  return candidate;
}

/** Candidate zero is unsuffixed; subsequent collisions use 1, 2, 3, and so on. */
export function usernameCandidate(base: string, collision: number = 0): string {
  if (!Number.isSafeInteger(collision) || collision < 0) {
    throw new Error('Collision count must be a non-negative safe integer.');
  }
  const normalised = normaliseUsername(base);
  if (normalised.length < 3 || normalised.length > 40) {
    throw new Error('Base usernames must contain between 3 and 40 supported characters.');
  }
  const suffix = collision === 0 ? '' : String(collision);
  return normalised.slice(0, 40 - suffix.length) + suffix;
}
