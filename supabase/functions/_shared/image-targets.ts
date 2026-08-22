import type { ImageUploadTargets } from './image-target-contract.ts';
import { defineImageUploadTargets } from './image-target-contract.ts';

// Developer-owned target policy. The HTTP request may select one of these names,
// but every destination and transform setting remains defined inside the app.
export const imageUploadTargets: ImageUploadTargets = defineImageUploadTargets({
  profile_avatar: {
    bucket: 'user-avatars',
    cacheControl: '31536000',
    filenamePrefix: 'avatar',
    fit: 'cover',
    maxHeight: 300,
    maxInputBytes: 5 * 1024 * 1024,
    maxInputPixels: 25_000_000,
    maxWidth: 300,
    outputFormat: 'jpeg',
    pathPrefix: '',
    qualityPercent: 80,
    signedUrlSeconds: 3600,
    visibility: 'private',
  },
  profile_header: {
    bucket: 'user-avatars',
    cacheControl: '31536000',
    filenamePrefix: 'header',
    fit: 'cover',
    maxHeight: 600,
    maxInputBytes: 5 * 1024 * 1024,
    maxInputPixels: 25_000_000,
    maxWidth: 1600,
    outputFormat: 'jpeg',
    pathPrefix: 'headers',
    qualityPercent: 80,
    signedUrlSeconds: 3600,
    visibility: 'private',
  },
});
