import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../supabase/migrations/20260920000000_editorial_security_repairs.sql', import.meta.url), 'utf8');
const rollback = await readFile(new URL('../supabase/rollback/20260920000000_editorial_security_repairs.sql', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/supabase-keepalive.yml', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/pages/Panel.tsx', import.meta.url), 'utf8');

test('repair removes legacy draft reads and requires aal2 for every admin write', () => {
  assert.match(migration, /REVOKE SELECT ON TABLE public\.site_settings FROM anon, authenticated/);
  assert.match(migration, /auth\.jwt\(\) ->> 'aal'.*= 'aal2'/s);
  assert.doesNotMatch(migration, /NOT has_factor/);
});

test('repair makes schedules valid, serialized and server-only', () => {
  assert.match(migration, /'schedule'/);
  assert.match(migration, /FOR UPDATE SKIP LOCKED/);
  assert.match(migration, /REVOKE ALL PRIVILEGES ON FUNCTION public\.publish_due_entities\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.publish_due_entities\(\) TO service_role/);
  assert.match(workflow, /secrets\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workflow, /--fail-with-body/);
});

test('featured study publication is a single protected RPC and has a rollback file', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.publish_featured_study\(p_payload jsonb\)/);
  assert.match(migration, /IF NOT public\.is_admin\(\)/);
  assert.match(panel, /client\.rpc\("publish_featured_study"/);
  assert.doesNotMatch(panel, /update\(\{ is_active: false \}\)/);
  assert.match(rollback, /DROP FUNCTION IF EXISTS public\.publish_featured_study\(jsonb\)/);
});
