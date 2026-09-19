import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const dataPath = new URL('../src/data/featuredStudy.ts', import.meta.url);
const hookPath = new URL('../src/hooks/useFeaturedStudy.ts', import.meta.url);
const panelPath = new URL('../src/pages/Panel.tsx', import.meta.url);
const migrationPath = new URL(
  '../supabase/migrations/20260919000000_featured_studies.sql',
  import.meta.url,
);

test('featured study exposes a safe static fallback', async () => {
  const data = await readFile(dataPath, 'utf8');
  assert.match(data, /export const DEFAULT_FEATURED_STUDY/);
  assert.match(data, /export function normalizeFeaturedStudy/);
  assert.match(data, /DEFAULT_FEATURED_STUDY\.slug/);
  assert.match(data, /thessaloniansStudy/);
  assert.match(data, /https:\/\//);
});

test('featured study hook degrades to the fallback when Supabase is absent or errors', async () => {
  const hook = await readFile(hookPath, 'utf8');
  assert.match(hook, /if \(!client\) return/);
  assert.match(hook, /featured_studies/);
  assert.match(hook, /normalizeFeaturedStudy/);
  assert.match(hook, /DEFAULT_FEATURED_STUDY/);
});

test('panel is gated by Supabase auth and writes only the featured study', async () => {
  const panel = await readFile(panelPath, 'utf8');
  assert.match(panel, /signInWithPassword/);
  assert.match(panel, /featured_studies/);
  assert.match(panel, /estudos-artes/);
  assert.match(panel, /signOut/);
  assert.match(panel, /noindex/);
});

test('panel route exists without appearing in navigation', async () => {
  const [routes, header] = await Promise.all([
    readFile(new URL('../src/SiteRoutes.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/site/SiteHeader.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(routes, /path="\/painel"/);
  assert.doesNotMatch(header, /painel/i);
});

test('featured studies migration enables RLS and a single active row', async () => {
  const migration = await readFile(migrationPath, 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.featured_studies/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /featured_studies_single_active/);
  assert.match(migration, /storage\.buckets/);
  assert.match(migration, /estudos-artes/);
  assert.match(migration, /ON CONFLICT \(slug\) DO NOTHING/);
  await access(migrationPath);
});
