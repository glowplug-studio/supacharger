import type {
  OrganisationBillingPageOverride,
  OrganisationChooserPageOverride,
  OrganisationSettingsSectionExtension,
  OrganisationTeamPageOverride,
} from '@/supacharger/organisations/organisation-settings-contract';

/** Product-only page behaviour. Shared profile, team, and billing behaviour remains Core-owned by default. */
export const organisationChooserPageOverride: OrganisationChooserPageOverride | null = null;
export const organisationTeamPageOverride: OrganisationTeamPageOverride | null = null;
export const organisationBillingPageOverride: OrganisationBillingPageOverride | null = null;
export const organisationSettingsSectionExtensions: OrganisationSettingsSectionExtension[] = [];
