import { z } from 'zod';

export const billingSubjectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('personal') }).strict(),
  z.object({ organisationId: z.uuid(), type: z.literal('organisation') }).strict(),
]);

export const billingCheckoutItemSchema = z.object({
  priceId: z.string().trim().regex(/^price_[A-Za-z0-9]{6,}$/).max(255),
  quantity: z.number().int().min(1).max(10_000).default(1),
}).strict();

export const billingCheckoutRequestSchema = z.object({
  items: z.array(billingCheckoutItemSchema).min(1).max(20),
  subject: billingSubjectSchema,
}).strict();

const billingProductOverviewSchema = z.object({
  id: z.string().optional(),
  name: z.string().nullable(),
  product_id: z.string().optional(),
}).passthrough().refine((row) => row.id || row.product_id, 'Product identifier is required.').transform((row) => ({
  ...row,
  id: row.id ?? row.product_id!,
}));

const billingPriceOverviewSchema = z.object({
  currency: z.string().nullable(),
  id: z.string().optional(),
  price_id: z.string().optional(),
  product: billingProductOverviewSchema.nullable(),
  unit_amount: z.number().nullable(),
}).passthrough().refine((row) => row.id || row.price_id, 'Price identifier is required.').transform((row) => ({
  ...row,
  id: row.id ?? row.price_id!,
}));

const billingItemOverviewSchema = z.object({
  current_period_end: z.string(),
  current_period_start: z.string(),
  id: z.string().optional(),
  price: billingPriceOverviewSchema,
  quantity: z.number().int().nullable(),
  subscription_item_id: z.string().optional(),
}).passthrough().refine(
  (row) => row.id || row.subscription_item_id,
  'Subscription-item identifier is required.',
).transform((row) => ({
  ...row,
  id: row.id ?? row.subscription_item_id!,
}));

const billingSubscriptionOverviewSchema = z.object({
  billing_mode: z.enum(['classic', 'flexible']).nullable(),
  cancel_at_period_end: z.boolean().nullable(),
  currency: z.string().nullable(),
  id: z.string().optional(),
  items: z.array(billingItemOverviewSchema),
  status: z.string().nullable(),
  subscription_id: z.string().optional(),
}).passthrough().refine(
  (row) => row.id || row.subscription_id,
  'Subscription identifier is required.',
).transform((row) => ({
  ...row,
  id: row.id ?? row.subscription_id!,
}));

export const billingAccountOverviewSchema = z.object({
  billing_account_id: z.uuid().optional(),
  display_name: z.string().nullable(),
  entitlements: z.array(z.object({
    feature_lookup_key: z.string(),
    metadata: z.unknown(),
    source: z.string(),
  }).passthrough()),
  id: z.uuid().optional(),
  member_role: z.enum(['owner', 'billing_admin', 'member']),
  subject_id: z.uuid(),
  subject_type: z.enum(['user', 'organisation', 'team', 'tenant', 'custom']),
  subscriptions: z.array(billingSubscriptionOverviewSchema),
}).passthrough().refine(
  (row) => row.id || row.billing_account_id,
  'Billing-account identifier is required.',
).transform((row) => ({
  ...row,
  id: row.id ?? row.billing_account_id!,
}));

export const billingOverviewSchema = z.array(billingAccountOverviewSchema);

export type BillingSubject = z.infer<typeof billingSubjectSchema>;
export type BillingCheckoutRequest = z.infer<typeof billingCheckoutRequestSchema>;
export type BillingAccountOverview = z.infer<typeof billingAccountOverviewSchema>;

export type BillingSubjectConfiguration = {
  BILLING: {
    ACCOUNT_SUBJECTS: {
      ORGANISATION: boolean;
      PERSONAL: boolean;
    };
  };
  ORGANISATIONS: { ENABLED: boolean };
};

export function billingSubjectIsEnabled(config: BillingSubjectConfiguration, subject: BillingSubject) {
  return subject.type === 'personal'
    ? config.BILLING.ACCOUNT_SUBJECTS.PERSONAL
    : config.ORGANISATIONS.ENABLED && config.BILLING.ACCOUNT_SUBJECTS.ORGANISATION;
}

export function billingAccountMatchesSubject(
  account: BillingAccountOverview,
  actorUserId: string,
  subject: BillingSubject,
) {
  return subject.type === 'personal'
    ? account.subject_type === 'user' && account.subject_id === actorUserId
    : account.subject_type === 'organisation' && account.subject_id === subject.organisationId;
}
