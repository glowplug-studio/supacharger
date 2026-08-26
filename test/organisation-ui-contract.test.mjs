import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function literalClassTokens(source) {
  return [...source.matchAll(/className=['"]([^'"]+)['"]/g)].flatMap((match) => match[1].split(/\s+/));
}

test('managed organisation presentation uses only semantic developer CSS hooks', async () => {
  const sources = await Promise.all([
    read('src/app/(supacharger)/(authenticated)/account/organisation/page.tsx'),
    read('src/supacharger/organisations/organisation-billing-page.tsx'),
    read('src/supacharger/organisations/organisation-chooser.tsx'),
    read('src/supacharger/organisations/organisation-profile-form.tsx'),
    read('src/supacharger/organisations/organisation-settings-shell.tsx'),
    read('src/supacharger/organisations/organisation-team.tsx'),
  ]);
  const tokens = sources.flatMap(literalClassTokens);
  assert.ok(tokens.length > 0);
  assert.deepEqual(
    tokens.filter((token) => !token.startsWith('sc-')),
    [],
  );

  const styles = await read('src/styles/supacharger-organisations.css');
  assert.match(styles, /\.sc-organisation-settings/);
  assert.match(styles, /\.sc-organisation-invite-form/);
  assert.doesNotMatch(styles, /@layer/);
});

test('installs canonical organisation chooser and settings routes', async () => {
  const [chooser, layout, profile, team, teamTab, billing, section] = await Promise.all([
    read('src/app/(supacharger)/(authenticated)/account/organisation/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/layout.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/team/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/team/[teamTab]/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/billing/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/[section]/page.tsx'),
  ]);
  assert.match(chooser, /SC_CONFIG\.ORGANISATIONS\.ENABLED/);
  assert.match(chooser, /notFound\(\)/);
  assert.match(layout, /ROUTE_MODE !== ['"]root-handle['"]/);
  assert.match(layout, /organisationHandleSchema\.safeParse/);
  assert.match(profile, /OrganisationProfileForm/);
  assert.match(team, /OrganisationTeam/);
  assert.match(teamTab, /organisationTeamPageOverride/);
  assert.match(billing, /OrganisationBillingPage/);
  assert.match(section, /organisationSettingsSectionExtensions/);
});

test('offers developer-owned organisation page, navigation, and chrome adapters', async () => {
  const [pages, navigation, chrome, layout, shell, contract] = await Promise.all([
    read('src/supacharger.adapters/organisations/pages.tsx'),
    read('src/supacharger.adapters/organisations/navigation.ts'),
    read('src/supacharger.adapters/organisations/chrome.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/layout.tsx'),
    read('src/supacharger/organisations/organisation-settings-shell.tsx'),
    read('src/supacharger/organisations/organisation-settings-contract.ts'),
  ]);
  assert.match(pages, /organisationChooserPageOverride/);
  assert.match(pages, /organisationTeamPageOverride/);
  assert.match(pages, /organisationBillingPageOverride/);
  assert.match(pages, /organisationSettingsSectionExtensions/);
  assert.match(navigation, /organisationSettingsNavigationExtensions/);
  assert.match(chrome, /OrganisationSettingsChrome/);
  assert.match(layout, /OrganisationSettingsChrome/);
  assert.match(shell, /organisationSettingsNavigationExtensions/);
  assert.match(contract, /reservedSectionIds/);
});

test('uses a server-validated FormProvider extension seam', async () => {
  const [form, api, adapter, fields] = await Promise.all([
    read('src/supacharger/organisations/organisation-profile-form.tsx'),
    read('src/app/(supacharger)/api/organisations/route.ts'),
    read('src/supacharger.adapters/organisations/profile-extension.ts'),
    read('src/supacharger.adapters/organisations/profile-fields.tsx'),
  ]);
  assert.match(form, /FormProvider/);
  assert.match(form, /OrganisationProfileFields/);
  assert.match(api, /organisationProfileExtensionSchema\.safeParse/);
  assert.match(api, /updateOrganisationProfileExtension/);
  assert.match(adapter, /z\.object\(\{\}\)\.strict\(\)/);
  assert.match(fields, /OrganisationProfileFields/);
});

test('covers context refresh, invitations, access review, and role protections', async () => {
  const [chooser, team, service, contract] = await Promise.all([
    read('src/supacharger/organisations/organisation-chooser.tsx'),
    read('src/supacharger/organisations/organisation-team.tsx'),
    read('src/supacharger/organisations/organisation-service.ts'),
    read('src/supacharger/organisations/organisation-contract.ts'),
  ]);
  assert.match(chooser, /action: 'invites\.accept'/);
  assert.match(chooser, /action: 'access\.request'/);
  assert.match(team, /members\.updateRole/);
  assert.match(team, /members\.remove/);
  assert.match(team, /invites\.revoke/);
  assert.match(team, /access\.\$\{decision\}/);
  assert.match(team, /timeZone: 'UTC'/);
  assert.match(service, /requiresSessionRefresh/);
  assert.match(service, /refreshSession\(\)/);
  assert.match(contract, /\['owner', 'admin', 'member'\]/);
});

test('organisation mutations retain inline feedback and emit action toasts', async () => {
  const sources = await Promise.all([
    read('src/supacharger/organisations/organisation-chooser.tsx'),
    read('src/supacharger/organisations/organisation-profile-form.tsx'),
    read('src/supacharger/organisations/organisation-team.tsx'),
  ]);
  for (const source of sources) {
    assert.match(source, /role=.*(?:alert|status)|role='(?:alert|status)'/);
    assert.match(source, /showActionToast/);
  }
});

test('keeps the active account navigation item visible on narrow screens', async () => {
  const shell = await read('src/supacharger/account/settings/account-settings-shell.tsx');
  assert.match(shell, /scrollIntoView\(\{ block: 'nearest', inline: 'nearest' \}\)/);
  assert.match(shell, /aria-current="page"/);
});

test('ships complete English copy and empty secondary placeholders', async () => {
  const english = await read('messages/en.json').then(JSON.parse);
  assert.ok(english.Organisations.chooser.title);
  assert.ok(english.Organisations.team.inviteDescription);
  assert.ok(english.Organisations.errors.invitationInvalid);
  const catalogueDirectory = new URL('../messages/', import.meta.url);
  const secondaryFiles = (await readdir(catalogueDirectory)).filter(
    (file) => file.endsWith('.json') && file !== 'en.json',
  );
  for (const file of secondaryFiles) {
    const catalogue = JSON.parse(await readFile(new URL(file, catalogueDirectory), 'utf8'));
    assert.equal(catalogue.Organisations.chooser.title, '');
  }
});

test('keeps product-only usage and agent licensing out of Core organisation contracts', async () => {
  const files = await Promise.all([
    read('src/supacharger/organisations/organisation-settings-shell.tsx'),
    read('src/supacharger/organisations/organisation-service.ts'),
    read('src/supacharger/organisations/organisation-contract.ts'),
  ]);
  const source = files.join('\n');
  assert.doesNotMatch(source, /agent licence|agent license|usage aggregation|openai key/i);
});
