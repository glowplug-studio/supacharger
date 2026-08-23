import { z } from 'zod';

export const organisationHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

export const organisationRoleSchema = z.enum(['owner', 'admin', 'member']);
export const organisationAccessPolicySchema = z.enum(['closed', 'request']);
export const organisationColourSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const organisationTargetSchema = z.object({
  organisationId: z.string().uuid().optional(),
  handle: organisationHandleSchema.optional(),
}).refine((value) => Boolean(value.organisationId || value.handle), {
  message: 'An organisation identifier is required.',
});

export const organisationActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z.object({ action: z.literal('handle.available'), handle: organisationHandleSchema }).strict(),
  z.object({
    action: z.literal('create'),
    colourHex: organisationColourSchema.optional(),
    handle: organisationHandleSchema,
    name: z.string().trim().min(1).max(100),
  }).strict(),
  z.object({ action: z.literal('switch'), handle: organisationHandleSchema }).strict(),
  z.object({ action: z.literal('read'), ...organisationTargetSchema.shape }).strict(),
  z.object({
    action: z.literal('update'),
    ...organisationTargetSchema.shape,
    accessPolicy: organisationAccessPolicySchema.optional(),
    avatarPath: z.string().trim().max(500).nullable().optional(),
    bio: z.string().trim().max(300).nullable().optional(),
    colourHex: organisationColourSchema.optional(),
    extension: z.record(z.string(), z.unknown()).default({}),
    handle: organisationHandleSchema,
    headerImagePath: z.string().trim().max(500).nullable().optional(),
    name: z.string().trim().min(1).max(100),
  }).strict(),
  z.object({ action: z.literal('members.list'), ...organisationTargetSchema.shape }).strict(),
  z.object({
    action: z.literal('members.add'),
    ...organisationTargetSchema.shape,
    role: organisationRoleSchema,
    userId: z.string().uuid(),
  }).strict(),
  z.object({
    action: z.literal('members.updateRole'),
    ...organisationTargetSchema.shape,
    role: organisationRoleSchema,
    userId: z.string().uuid(),
  }).strict(),
  z.object({ action: z.literal('members.remove'), ...organisationTargetSchema.shape, userId: z.string().uuid() }).strict(),
  z.object({ action: z.literal('invites.list'), ...organisationTargetSchema.shape }).strict(),
  z.object({
    action: z.literal('invites.create'),
    ...organisationTargetSchema.shape,
    email: z.string().trim().toLowerCase().email().max(320),
    role: z.enum(['admin', 'member']),
  }).strict(),
  z.object({
    action: z.literal('invites.revoke'),
    ...organisationTargetSchema.shape,
    invitationId: z.string().uuid(),
  }).strict(),
  z.object({ action: z.literal('invites.accept'), token: z.string().trim().min(32).max(256) }).strict(),
  z.object({ action: z.literal('access.request'), handle: organisationHandleSchema }).strict(),
  z.object({ action: z.literal('access.list'), ...organisationTargetSchema.shape }).strict(),
  z.object({
    action: z.enum(['access.approve', 'access.reject']),
    ...organisationTargetSchema.shape,
    requestId: z.string().uuid(),
  }).strict(),
]);

export type OrganisationAction = z.infer<typeof organisationActionSchema>;

export const organisationSummarySchema = z.object({
  access_policy: organisationAccessPolicySchema,
  avatar_path: z.string().nullable(),
  bio: z.string().nullable(),
  colour_hex: z.string(),
  created_at: z.string(),
  handle: organisationHandleSchema,
  header_image_path: z.string().nullable(),
  id: z.string().uuid(),
  is_active: z.boolean(),
  member_count: z.number().int().nonnegative(),
  name: z.string(),
  role: organisationRoleSchema,
  updated_at: z.string(),
});

export const organisationMemberSchema = z.object({
  avatar_path: z.string().nullable(),
  first_name: z.string().nullable(),
  joined_at: z.string(),
  last_name: z.string().nullable(),
  role: organisationRoleSchema,
  user_id: z.string().uuid(),
  username: z.string().nullable(),
});

export const organisationInvitationSchema = z.object({
  created_at: z.string(),
  email: z.string(),
  expires_at: z.string(),
  id: z.string().uuid(),
  invited_by: z.string().uuid(),
  role: organisationRoleSchema,
});

export const organisationAccessRequestSchema = z.object({
  avatar_path: z.string().nullable(),
  created_at: z.string(),
  first_name: z.string().nullable(),
  id: z.string().uuid(),
  last_name: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
  user_id: z.string().uuid(),
  username: z.string().nullable(),
});

export const organisationDetailsSchema = organisationSummarySchema.extend({
  access_requests: z.array(organisationAccessRequestSchema),
  invitations: z.array(organisationInvitationSchema),
  members: z.array(organisationMemberSchema),
});

export const organisationListSchema = z.object({
  activeOrganisationId: z.string().uuid().nullable(),
  organisations: z.array(organisationSummarySchema),
});

export type OrganisationSummary = z.infer<typeof organisationSummarySchema>;
export type OrganisationDetails = z.infer<typeof organisationDetailsSchema>;
export type OrganisationMember = z.infer<typeof organisationMemberSchema>;

export type OrganisationMutationResponse =
  | { ok: true; organisation: Record<string, unknown> }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
