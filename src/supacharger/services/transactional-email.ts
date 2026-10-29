import { z } from 'zod';

import 'server-only';

const recipient = z.object({ email: z.email().max(254), name: z.string().max(200).regex(/^[^\r\n]*$/).optional() }).strict();
export const transactionalMessageSchema = z.object({
  id: z.uuid(),
  to: recipient,
  content: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('template'), key: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/), variables: z.record(z.string(), z.json()) }).strict(),
    z.object({ kind: z.literal('rendered'), subject: z.string().min(1).max(998).regex(/^[^\r\n]*$/), html: z.string().min(1).max(90000).optional(), text: z.string().min(1).max(90000).optional() }).strict().refine(value => !!(value.html || value.text)),
  ]),
  replyTo: recipient.optional(),
}).strict().refine(value => new TextEncoder().encode(JSON.stringify(value)).length <= 100000);
export type TransactionalMessage = z.infer<typeof transactionalMessageSchema>;
type Database = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };

/** Binding comes from validated installation preparation, never from a request. */
export function createTransactionalEmailService(database: Database, binding: { enqueueRpc: string; contentKinds: readonly ('template' | 'rendered')[] } | null) {
  return async (messages: TransactionalMessage[]) => {
    if (!binding) throw new Error('Required core service transactional_email is unavailable');
    const parsed = z.array(transactionalMessageSchema).min(1).max(1000).parse(messages);
    if (new Set(parsed.map(message => message.id)).size !== parsed.length) throw new Error('Duplicate message IDs');
    if (parsed.some(message => !binding.contentKinds.includes(message.content.kind))) throw new Error('Selected email transport does not support this content');
    const response = await database.rpc(binding.enqueueRpc, { messages: parsed });
    const ids = z.array(z.uuid()).safeParse(response.data);
    if (response.error || !ids.success || JSON.stringify(ids.data) !== JSON.stringify(parsed.map(message => message.id))) throw new Error('Could not queue transactional email');
    return { queued: ids.data };
  };
}
