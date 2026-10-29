import { supabaseResourceName } from '@/supacharger/namespace';

import type { ImageUploadTargets } from '../../../supabase/functions/_shared/image-target-contract';
import { defineImageUploadTargets } from '../../../supabase/functions/_shared/image-target-contract';

import 'server-only';

// Server-owned image policies. Only signed settings are accepted by the Edge processor.
export const imageUploadTargets: ImageUploadTargets = defineImageUploadTargets({
  profile_avatar: {
    bucket: supabaseResourceName('user-avatars', 'bucket'),
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
    bucket: supabaseResourceName('user-avatars', 'bucket'),
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
