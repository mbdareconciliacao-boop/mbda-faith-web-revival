import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVideos } from '../scripts/sync-youtube.mjs';

const video = (id = 'abcdefghijk') => ({ id,
  snippet: { channelId: 'church', title: 'Mensagem da igreja', description: 'Fé e esperança. https://example.com Mais informações.', publishedAt: '2026-09-01T12:00:00Z', liveBroadcastContent: 'none' },
  status: { privacyStatus: 'public', uploadStatus: 'processed', embeddable: true },
});
test('YouTube: trecho fiel, link oficial e URL estável segura', () => {
  const [result] = normalizeVideos([video(), video()], 'church');
  assert.equal(result.description, 'Fé e esperança. Mais informações.');
  assert.equal(result.source, 'https://www.youtube.com/watch?v=abcdefghijk');
  assert.match(result.slug, /^video-[a-f0-9]+$/);
  assert.equal(normalizeVideos([video(), video()], 'church').length, 1);
});
test('YouTube: rejeita outro canal, privados, lives, futuros e IDs inválidos', () => {
  for (const mutate of [v => v.snippet.channelId = 'other', v => v.status.privacyStatus = 'private',
    v => v.status.embeddable = false, v => v.snippet.liveBroadcastContent = 'live',
    v => v.snippet.publishedAt = '2099-01-01', v => v.id = '../unsafe']) {
    const v = video(); mutate(v);
    assert.deepEqual(normalizeVideos([v], 'church'), []);
  }
});
test('YouTube: limita texto e mantém fallback sem descrição', () => {
  const v = video(); v.snippet.description = 'palavra '.repeat(1000);
  assert.ok(normalizeVideos([v], 'church')[0].description.length <= 320);
  v.snippet.description = '';
  assert.match(normalizeVideos([v], 'church')[0].description, /não informada/);
});
