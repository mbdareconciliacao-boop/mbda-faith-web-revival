import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const panel = new URL('../src/pages/Panel.tsx', import.meta.url);
const migration = new URL('../supabase/migrations/20260919060000_admin_mfa.sql', import.meta.url);

test('panel requires and enrols TOTP for the admin', async () => {
  const source = await readFile(panel, 'utf8');
  assert.match(source, /getAuthenticatorAssuranceLevel/);
  assert.match(source, /mfa\.enroll/);
  assert.match(source, /mfa\.challenge/);
  assert.match(source, /mfa\.verify/);
  assert.match(source, /aal2/);
});

test('is_admin requires aal2 only when a verified factor exists', async () => {
  const sql = await readFile(migration, 'utf8');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.is_admin/);
  assert.match(sql, /auth\.mfa_factors/);
  assert.match(sql, /status = 'verified'/);
  assert.match(sql, /aal2/);
  assert.match(sql, /SECURITY DEFINER/);
});
