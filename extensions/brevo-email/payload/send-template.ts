/** Server-only transport. Applications supply authorised data, never browser payloads. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type Recipient = { email: string; name?: string };
export type TemplateMessage = {
  to: Recipient[];
  params: Record<string, Json>;
  /** Stable globally unique notification UUID; reuse on retry. */
  idempotencyKey: string;
  replyTo?: Recipient;
  tags?: string[];
};
export type SendResult =
  | { accepted: true; duplicate: boolean; messageId?: string }
  | { accepted: false; reason: 'invalid_message' | 'provider_rejected' | 'unavailable'; status?: number };

export function createBrevoTemplateSender(options: {
  env: (name: string) => string | undefined;
  templateEnv: string;
  apiKeyEnv?: string;
  fetch?: typeof fetch;
}) {
  const apiKey = options.env(options.apiKeyEnv ?? 'BREVO_API_KEY')?.trim();
  const rawId = options.env(options.templateEnv)?.trim() ?? '';
  const templateId = Number(rawId);
  if (!apiKey || !/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(templateId)) {
    throw new Error('Brevo template delivery is not configured');
  }
  const transport = options.fetch ?? globalThis.fetch;
  return async (message: TemplateMessage): Promise<SendResult> => {
    const validRecipient = (value: Recipient) => value && typeof value.email === 'string' &&
      /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.email) && value.email.length <= 254 &&
      (value.name === undefined || (typeof value.name === 'string' && value.name.length <= 200 && !/[\r\n]/.test(value.name)));
    let body: string;
    try {
      if (!Array.isArray(message.to) || message.to.length < 1 || message.to.length > 99 ||
        !message.to.every(validRecipient) ||
        new Set(message.to.map(({ email }) => email.toLowerCase())).size !== message.to.length ||
        typeof message.idempotencyKey !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(message.idempotencyKey) ||
        !message.params || Array.isArray(message.params) || typeof message.params !== 'object' ||
        (message.replyTo !== undefined && !validRecipient(message.replyTo)) ||
        (message.tags !== undefined && (!Array.isArray(message.tags) || message.tags.length > 10 ||
          !message.tags.every(tag => typeof tag === 'string' && /^[a-zA-Z0-9:_-]{1,128}$/.test(tag))))) {
        return { accepted: false, reason: 'invalid_message' };
      }
      const params = JSON.stringify(message.params, (_key, value) => {
        if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol' ||
          (typeof value === 'number' && !Number.isFinite(value))) throw new Error('Not JSON');
        return value;
      });
      if (new TextEncoder().encode(params).length > 100_000) return { accepted: false, reason: 'invalid_message' };
      body = JSON.stringify({
        templateId, to: message.to.map(({ email, name }) => ({ email, name })), params: JSON.parse(params),
        headers: { idempotencyKey: message.idempotencyKey },
        ...(message.replyTo ? { replyTo: { email: message.replyTo.email, name: message.replyTo.name } } : {}),
        ...(message.tags ? { tags: message.tags } : {}),
      });
    } catch {
      return { accepted: false, reason: 'invalid_message' };
    }
    try {
      const response = await transport('https://api.brevo.com/v3/smtp/email', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey }, body,
      });
      // Do not expose provider errors, credentials or recipient data to callers/logs.
      const result = await response.json().catch(() => null);
      if (response.status === 201 && typeof result?.messageId === 'string' && result.messageId.length > 0) {
        return { accepted: true, duplicate: false, messageId: result.messageId };
      }
      // duplicate_parameter is generic: acknowledge only an explicit idempotency duplicate.
      if (response.status === 400 && result?.code === 'duplicate_parameter' &&
        typeof result?.message === 'string' && /idempotency/i.test(result.message)) {
        return { accepted: true, duplicate: true };
      }
      return { accepted: false, reason: 'provider_rejected', status: response.status };
    } catch {
      // Timeout can mean provider acceptance without an acknowledgement: retry the same ID.
      return { accepted: false, reason: 'unavailable' };
    }
  };
}
