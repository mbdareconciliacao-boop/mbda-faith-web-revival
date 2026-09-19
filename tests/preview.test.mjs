import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('provider accepts live preview messages only when embedded', async () => {
  const provider = await readFile(
    new URL('../src/components/site/SiteSettingsProvider.tsx', import.meta.url),
    'utf8',
  );
  assert.match(provider, /window\.self === window\.top/);
  assert.match(provider, /event\.origin !== window\.location\.origin/);
  assert.match(provider, /mbdar-panel/);
  assert.match(provider, /normalizeSiteSettings/);
});

test('panel embeds the real site and posts the draft settings', async () => {
  const panel = await readFile(new URL('../src/pages/Panel.tsx', import.meta.url), 'utf8');
  assert.match(panel, /<iframe/);
  assert.match(panel, /contentWindow\.postMessage/);
  assert.match(panel, /source: "mbdar-panel"/);
  assert.match(panel, /panel-live-frame/);
});

test('site can be framed only by itself', async () => {
  const vercel = await readFile(new URL('../vercel.json', import.meta.url), 'utf8');
  assert.match(vercel, /frame-ancestors 'self'/);
  assert.match(vercel, /"X-Frame-Options",\s*"value": "SAMEORIGIN"/);
});
