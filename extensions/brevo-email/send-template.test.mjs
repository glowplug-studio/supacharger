import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrevoTemplateSender } from './payload/send-template.ts';

const env = name => ({ BREVO_API_KEY: 'test-only-key', TEMPLATE_A: '123', TEMPLATE_B: '456' })[name];
const message = { to: [{ email: 'recipient@example.com' }], params: { name: '<b>literal</b>', count: 1 }, idempotencyKey: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
test('template/environment mapping is project-independent; no arbitrary fields reach Brevo', async () => {
  for (const [templateEnv, id] of [['TEMPLATE_A', 123], ['TEMPLATE_B', 456]]) {
    const send = createBrevoTemplateSender({ env, templateEnv, fetch: async (url, init) => {
      assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
      assert.equal(init.headers['api-key'], 'test-only-key');
      const payload = JSON.parse(init.body);
      assert.equal(payload.templateId, id);
      assert.deepEqual(payload.params, message.params);
      assert.equal(payload.headers.idempotencyKey, message.idempotencyKey);
      assert.equal(payload.htmlContent, undefined);
      assert.equal(payload.sender, undefined);
      return Response.json({ messageId: '<test>' }, { status: 201 });
    } });
    assert.deepEqual(await send({ ...message, htmlContent: 'untrusted', templateId: 999 }), { accepted: true, duplicate: false, messageId: '<test>' });
  }
});
test('bad configuration fails before any delivery', () => {
  for (const id of ['', '0', '-1', '1.5', '1e2', 'NaN', '9007199254740992'])
    assert.throws(() => createBrevoTemplateSender({ env: name => name === 'BREVO_API_KEY' ? 'key' : id, templateEnv: 'TEMPLATE' }));
});
test('invalid recipients and payloads do not invoke transport', async () => {
  const send = createBrevoTemplateSender({ env, templateEnv: 'TEMPLATE_A', fetch: () => assert.fail('Must not send') });
  for (const patch of [{ to: [] }, { to: [{ email: 'bad\r\nBcc:x' }] }, { idempotencyKey: '' },
    { to: [message.to[0], message.to[0]] }, { params: { value: NaN } }, { params: { value: 'x'.repeat(100001) } }])
    assert.equal((await send({ ...message, ...patch })).accepted, false);
});
test('provider rejections, malformed acceptance and timeouts remain retryable by the outbox', async () => {
  for (const [status, body, accepted] of [[201, {}, false], [400, { code: 'duplicate_parameter', message: 'Idempotency key already processed' }, true],
    [400, { code: 'duplicate_parameter', message: 'Another parameter exists' }, false],
    [400, { code: 'invalid_parameter' }, false], [401, {}, false], [429, {}, false], [503, {}, false]]) {
    const send = createBrevoTemplateSender({ env, templateEnv: 'TEMPLATE_A', fetch: async () => Response.json(body, { status }) });
    assert.equal((await send(message)).accepted, accepted);
  }
  const send = createBrevoTemplateSender({ env, templateEnv: 'TEMPLATE_A', fetch: async () => { throw new Error('timeout'); } });
  assert.deepEqual(await send(message), { accepted: false, reason: 'unavailable' });
});
