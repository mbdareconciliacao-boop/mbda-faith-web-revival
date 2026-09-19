import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const settings = new URL('../src/data/siteSettings.ts', import.meta.url);
const mediaMigration = new URL(
  '../supabase/migrations/20260919040000_site_media.sql',
  import.meta.url,
);

const components = [
  '../src/components/site/SiteHeader.tsx',
  '../src/components/site/HomeHero.tsx',
  '../src/components/site/WeeklyPreview.tsx',
  '../src/components/site/EventGallery.tsx',
  '../src/components/site/SiteFooter.tsx',
];

test('site settings carry structured content for brand, home, contact and footer', async () => {
  const data = await readFile(settings, 'utf8');
  assert.match(data, /export interface SiteContent/);
  assert.match(data, /brand: \{ name: string; logo: string \}/);
  assert.match(data, /heroLines: string\[\]/);
  assert.match(data, /paths: SitePath\[\]/);
  assert.match(data, /contact: \{/);
  assert.match(data, /footer: \{/);
  assert.match(data, /asContent/);
});

test('public components read text and images from the published content', async () => {
  for (const rel of components) {
    const source = await readFile(new URL(rel, import.meta.url), 'utf8');
    assert.match(source, /useSiteSettings/, `${rel} nao usa useSiteSettings`);
  }
  const provider = await readFile(
    new URL('../src/components/site/SiteSettingsProvider.tsx', import.meta.url),
    'utf8',
  );
  assert.match(provider, /from\("site_entities"\)/);
  assert.match(provider, /SiteSettingsContext\.Provider/);
});

test('site media bucket is public for reading and admin-only for writing', async () => {
  const migration = await readFile(mediaMigration, 'utf8');
  assert.match(migration, /'site-media', 'site-media', true/);
  assert.match(migration, /file_size_limit = 5242880/);
  assert.match(migration, /site_media_public_read/);
  assert.match(migration, /site_media_admin_insert/);
  assert.match(migration, /public\.is_admin\(\)/);
});
