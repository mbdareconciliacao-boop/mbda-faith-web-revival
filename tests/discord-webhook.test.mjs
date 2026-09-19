import test from 'node:test';
import assert from 'node:assert/strict';

import { sendDiscordWebhook, validateDiscordWebhook } from '../scripts/discord-webhook.mjs';
import { failureMessage, successMessage } from '../scripts/notify-youtube-sync.mjs';

const validWebhook = 'https://discord.com/api/webhooks/123456789/token_value-ABC';

test('Discord: aceita somente webhook HTTPS oficial sem parâmetros ou credenciais', () => {
  assert.equal(validateDiscordWebhook(validWebhook).hostname, 'discord.com');
  for (const value of [
    'http://discord.com/api/webhooks/123/token',
    'https://discord.com.attacker.test/api/webhooks/123/token',
    'https://discord.com/api/webhooks/123/token?wait=true',
    'javascript:alert(1)',
    '',
  ]) assert.throws(() => validateDiscordWebhook(value));
});

test('Discord: desativa menções e não expõe o webhook no payload', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 204 };
  };
  await sendDiscordWebhook({
    webhookUrl: validWebhook,
    title: '@everyone Novo vídeo',
    description: 'Publicado.',
  }, fetchImpl);
  const payload = JSON.parse(request.options.body);
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
  assert.equal(payload.embeds.length, 1);
  assert.doesNotMatch(request.options.body, /token_value-ABC/);
});

test('Discord: mensagem de sucesso lista apenas vídeos novos', () => {
  const message = successMessage({ newVideos: [{ title: 'Mensagem', source: 'https://www.youtube.com/watch?v=abcdefghijk' }] });
  assert.match(message.title, /Novo vídeo/);
  assert.match(message.description, /youtube\.com/);
  assert.match(message.description, /nenhum vídeo foi enviado à Vercel/);
});

test('Discord: mensagem de falha preserva contexto sem segredo', () => {
  const message = failureMessage('https://github.com/example/actions/runs/1');
  assert.match(message.description, /catálogo anterior foi preservado/);
  assert.equal(message.url, 'https://github.com/example/actions/runs/1');
});

