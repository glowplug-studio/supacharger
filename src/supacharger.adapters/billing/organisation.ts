export async function resolveOrganisationBillingAccount(_input: {
  actorUserId: string;
  organisationId: string;
}): Promise<string> {
  throw new Error('Organisation billing is not configured for this application.');
}
