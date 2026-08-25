import type { ReactNode } from 'react';

import type { OrganisationDetails } from './organisation-contract';

export type OrganisationChooserSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type OrganisationChooserPageOverride = (input: {
  searchParams: OrganisationChooserSearchParams;
}) => ReactNode | Promise<ReactNode>;

export type OrganisationSettingsPageContext = {
  organisation: OrganisationDetails;
};

export type OrganisationTeamPageContext = OrganisationSettingsPageContext & {
  teamTab: string | null;
};

export type OrganisationBillingPageContext = OrganisationSettingsPageContext & {
  portalError: boolean;
};

export type OrganisationTeamPageOverride = (input: OrganisationTeamPageContext) => ReactNode | Promise<ReactNode>;

export type OrganisationBillingPageOverride = (input: OrganisationBillingPageContext) => ReactNode | Promise<ReactNode>;

export type OrganisationSettingsSectionExtension = {
  id: string;
  render: (input: OrganisationSettingsPageContext) => ReactNode | Promise<ReactNode>;
};

export type OrganisationSettingsNavigationExtension = {
  id: string;
  label: string;
  order: number;
};

const reservedSectionIds = new Set(['billing', 'profile', 'team']);
const sectionIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateOrganisationSettingsExtensionIds(extensions: ReadonlyArray<{ id: string }>, source: string) {
  const seen = new Set<string>();

  for (const extension of extensions) {
    if (!sectionIdPattern.test(extension.id)) {
      throw new Error(`${source} contains an invalid organisation settings section: ${extension.id}`);
    }
    if (reservedSectionIds.has(extension.id)) {
      throw new Error(`${source} cannot replace the Core organisation settings section: ${extension.id}`);
    }
    if (seen.has(extension.id)) {
      throw new Error(`${source} contains a duplicate organisation settings section: ${extension.id}`);
    }
    seen.add(extension.id);
  }
}
