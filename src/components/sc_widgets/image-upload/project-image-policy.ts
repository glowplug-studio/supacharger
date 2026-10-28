/**
 * Project-owned upload presentation and destination policy.
 *
 * Server-side output size, compression, format and bucket policy live in
 * `src/supacharger.adapters/media/image-targets.ts`. Keep these target and
 * destination names aligned with that file.
 */
export const profileImageWidgetPolicy = {
  avatar: {
    aspectRatio: 1,
    bucket: 'user-avatars',
    destination: '',
    maxInputBytes: 5 * 1024 * 1024,
    shape: 'circle' as const,
    target: 'profile_avatar',
  },
  banner: {
    aspectRatio: 8 / 3,
    bucket: 'user-avatars',
    destination: 'headers',
    maxInputBytes: 5 * 1024 * 1024,
    shape: 'rectangle' as const,
    target: 'profile_header',
  },
} as const;
