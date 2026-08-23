export const instant = false;

import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { resolveSignedMediaUrls } from '@/supacharger/media/signed-media';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { OrganisationProfileForm } from '@/supacharger/organisations/organisation-profile-form';
import { loadOrganisationProfile } from '@/supacharger/organisations/organisation-service';

export default async function OrganisationProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const parsed = organisationHandleSchema.safeParse((await params).handle);
  if (!parsed.success) notFound();
  const [{ details, extension }, supabase] = await Promise.all([loadOrganisationProfile(parsed.data), createClient()]);
  const media = await resolveSignedMediaUrls(supabase, [
    { bucket: 'organisation-logos', key: 'avatar', path: details.avatar_path },
    { bucket: 'organisation-logos', key: 'header', path: details.header_image_path },
  ]);
  return <OrganisationProfileForm avatarUrl={media.avatar} extension={extension} headerImageUrl={media.header} organisation={details} />;
}
