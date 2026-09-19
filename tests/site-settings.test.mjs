import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dataPath = new URL('../src/data/siteSettings.ts', import.meta.url);
const hookPath = new URL('../src/hooks/useSiteSettings.ts', import.meta.url);
const panelPath = new URL('../src/pages/Panel.tsx', import.meta.url);
const migrationPath = new URL(
  '../supabase/migrations/20260919030000_site_settings.sql',
  import.meta.url,
);

test('site settings expose theme defaults, colors and font options', async () => {
  const data = await readFile(dataPath, 'utf8');
  assert.match(data, /export const DEFAULT_SITE_SETTINGS/);
  assert.match(data, /export const THEME_COLOR_FIELDS/);
  assert.match(data, /export const FONT_OPTIONS/);
  assert.match(data, /export function applyTheme/);
  assert.match(data, /export function normalizeSiteSettings/);
  assert.match(data, /--gold/);
  assert.match(data, /--display/);
});

test('site theme applies published settings and degrades to defaults', async () => {
  const hook = await readFile(hookPath, 'utf8');
  assert.match(hook, /if \(!client\) return/);
  assert.match(hook, /from\("site_settings"\)/);
  assert.match(hook, /applyTheme/);
  assert.match(hook, /DEFAULT_SITE_SETTINGS/);
});

test('panel edits appearance with live theme application', async () => {
  const panel = await readFile(panelPath, 'utf8');
  assert.match(panel, /applyTheme\(/);
  assert.match(panel, /THEME_COLOR_FIELDS/);
  assert.match(panel, /FONT_OPTIONS/);
  assert.match(panel, /publish_site_settings/);
  assert.match(panel, /rollback_site_settings/);
  assert.match(panel, /content_revisions/);
  assert.match(panel, /type="color"/);
});

test('site settings migration keeps draft, publish and rollback safe', async () => {
  const migration = await readFile(migrationPath, 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.site_settings/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.content_revisions/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /public\.is_admin\(\)/);
  assert.match(migration, /publish_site_settings/);
  assert.match(migration, /rollback_site_settings/);
  assert.match(migration, /SECURITY DEFINER/);
});
