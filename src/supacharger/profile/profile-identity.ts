export type UsernamePolicy = 'disabled' | 'optional' | 'required';

export type ProfileIdentitySource = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
};

export type ProfileIdentity = {
  displayName: string;
  initials: string;
  username: string | null;
};

function nonBlank(value: string | null | undefined) {
  const normalised = value?.trim();
  return normalised ? normalised : null;
}

export function projectProfileIdentity(
  profile: ProfileIdentitySource,
  usernamePolicy: UsernamePolicy,
  options: { ownerView?: boolean } = {},
): ProfileIdentity {
  const firstName = nonBlank(profile.first_name);
  const lastName = nonBlank(profile.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
  const username = usernamePolicy === 'disabled' ? null : nonBlank(profile.username);
  const ownerEmail = options.ownerView ? nonBlank(profile.email) : null;
  const displayName = fullName ?? username ?? ownerEmail ?? 'Account';
  const initialsSource = fullName ?? username ?? ownerEmail ?? 'A';
  const initials = initialsSource
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return {
    displayName,
    initials: initials || 'A',
    username,
  };
}

