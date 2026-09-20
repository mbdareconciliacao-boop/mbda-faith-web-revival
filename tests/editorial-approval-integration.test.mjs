import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../supabase/migrations/20260920010000_editorial_roles_and_approval.sql', import.meta.url), 'utf8');
const rollback = await readFile(new URL('../supabase/rollback/20260920010000_editorial_roles_and_approval.sql', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/pages/Panel.tsx', import.meta.url), 'utf8');

test('roles and entity assignments are enforced by the database', () => {
  assert.match(migration, /CHECK \(role IN \('contributor', 'editor', 'reviewer', 'admin'\)\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.get_editorial_profile\(\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.can_edit_editorial\(p_entity text\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.can_view_editorial\(p_entity text\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.can_review_editorial\(\)/);
});

test('approval is mandatory and the submitter cannot self-approve', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.submit_editorial\(p_entity text\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.approve_editorial\(p_entity text\)/);
  assert.match(migration, /self approval is not allowed/);
  assert.match(migration, /flow\.status <> 'approved' OR flow\.approved_revision <> flow\.revision/);
  assert.match(migration, /IF NOT public\.is_admin\(\)/);
});

test('browser writes only through protected RPCs', () => {
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON TABLE public\.site_entities FROM authenticated/);
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON TABLE public\.content_revisions FROM authenticated/);
  assert.match(migration, /USING \(public\.can_view_editorial\(entity\)\)/);
  assert.match(panel, /client\.rpc\("save_editorial_draft"/);
  assert.match(panel, /client\.rpc\("submit_editorial"/);
  assert.match(panel, /client\.rpc\("request_editorial_changes"/);
  assert.match(panel, /client\.rpc\("approve_editorial"/);
  assert.match(panel, /client\.rpc\("restore_editorial_revision"/);
  assert.doesNotMatch(panel, /\.from\("site_entities"\)\.upsert/);
});

test('rollback is conservative and retains audit data', () => {
  assert.match(rollback, /sem apagar seus registros/i);
  assert.doesNotMatch(rollback, /DROP TABLE.*editorial_workflow/i);
});
