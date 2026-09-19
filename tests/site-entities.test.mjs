import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const settings = new URL('../src/data/siteSettings.ts', import.meta.url);
const migration = new URL('../supabase/migrations/20260919050000_site_entities.sql', import.meta.url);

test('settings expose per-entity extraction and merge', async () => {
  const data = await readFile(settings, 'utf8');
  assert.match(data, /export type SiteEntity/);
  assert.match(data, /export const SITE_ENTITIES/);
  assert.match(data, /export function entityContent/);
  assert.match(data, /export function mergeEntityRows/);
});

test('provider loads published entities', async () => {
  const provider = await readFile(
    new URL('../src/components/site/SiteSettingsProvider.tsx', import.meta.url),
    'utf8',
  );
  assert.match(provider, /from\("site_entities"\)/);
  assert.match(provider, /eq\("state", "published"\)/);
  assert.match(provider, /mergeEntityRows/);
});

test('panel publishes and schedules per entity', async () => {
  const panel = await readFile(new URL('../src/pages/Panel.tsx', import.meta.url), 'utf8');
  assert.match(panel, /TAB_ENTITY/);
  assert.match(panel, /publish_entity/);
  assert.match(panel, /p_publish_at/);
  assert.match(panel, /site_entities/);
  assert.match(panel, /type="datetime-local"/);
});

test('entities migration keeps RLS, publish and scheduler functions', async () => {
  const sql = await readFile(migration, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.site_entities/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /state = 'published'/);
  assert.match(sql, /publish_entity/);
  assert.match(sql, /publish_due_entities/);
  assert.match(sql, /SECURITY DEFINER/);
});

test('scheduler workflow publishes due entities hourly', async () => {
  const workflow = await readFile(
    new URL('../.github/workflows/supabase-keepalive.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /cron: '0 \* \* \* \*'/);
  assert.match(workflow, /publish_due_entities/);
});
