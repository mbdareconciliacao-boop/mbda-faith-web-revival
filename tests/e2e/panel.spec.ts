import { expect, test } from '@playwright/test';

// No production login or database access: all Supabase traffic is intercepted.
test.beforeEach(async ({ page }) => {
  const user = { id: 'local-editor', email: 'editor@example.test', factors: [{ id: 'totp-test', factor_type: 'totp', status: 'verified' }] };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, aal: 'aal2', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.bG9jYWw`;
  await page.addInitScript(({ user, token }) => {
    localStorage.setItem('sb-panel-test-auth-token', JSON.stringify({ access_token: token, refresh_token: 'local', expires_at: Math.floor(Date.now() / 1000) + 3600, user, token_type: 'bearer' }));
  }, { user, token });
  await page.route('https://panel-test.supabase.co/**', async (route) => {
    const url = route.request().url();
    const body = url.includes('/auth/v1/user') ? user : url.includes('/rpc/is_admin') ? true : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
});

for (const width of [390, 1024, 1440]) {
  test(`editor and preview do not overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/painel');
    await expect(page.getByRole('heading', { name: 'Painel editorial' })).toBeVisible();
    await page.getByRole('button', { name: 'Textos', exact: true }).click();
    await expect(page.getByLabel('Nome da igreja')).toBeEditable();
    const controls = await page.locator('.panel-controls').boundingBox();
    const preview = await page.locator('.panel-preview-col').boundingBox();
    expect(controls).not.toBeNull();
    expect(preview).not.toBeNull();
    expect(preview!.x >= controls!.x + controls!.width || preview!.y >= controls!.y + controls!.height).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/panel-${width}.png` });
    await page.getByRole('button', { name: 'Ocultar prévia' }).click();
    await expect(page.locator('.panel-preview-col')).toHaveCount(0);
    await page.getByRole('button', { name: 'Mostrar prévia' }).click();
    await expect(page.locator('.panel-preview-col')).toBeVisible();
  });
}

test('draft video ID can be typed character by character', async ({ page }) => {
  await page.goto('/painel');
  await page.getByRole('button', { name: 'Textos', exact: true }).click();
  await page.getByLabel('YouTube ID').pressSequentially('abcdefghijk');
  await expect(page.getByLabel('YouTube ID')).toHaveValue('abcdefghijk');
});

test('a non-admin with MFA cannot open the editor', async ({ page }) => {
  await page.route('**/rest/v1/rpc/is_admin', route => route.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
  await page.goto('/painel');
  await expect(page.getByRole('heading', { name: 'Acesso não liberado' })).toBeVisible();
  await expect(page.locator('.panel-controls')).toHaveCount(0);
});

test('an aal1 session stays at MFA and does not load editorial drafts', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'sb-panel-test-auth-token';
    const session = JSON.parse(localStorage.getItem(key)!);
    const parts = session.access_token.split('.');
    parts[1] = btoa(JSON.stringify({ sub: 'local-editor', aal: 'aal1', exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    session.access_token = parts.join('.');
    localStorage.setItem(key, JSON.stringify(session));
  });
  const adminChecks: string[] = [];
  page.on('request', request => { if (request.url().includes('/rpc/is_admin')) adminChecks.push(request.url()); });
  await page.goto('/painel');
  await expect(page.getByRole('heading', { name: 'Segurança da conta' })).toBeVisible();
  await expect(page.locator('.panel-controls')).toHaveCount(0);
  expect(adminChecks).toHaveLength(0);
});

test('failed content reads block editing instead of saving defaults', async ({ page }) => {
  await page.route('**/rest/v1/site_entities?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"offline"}' }));
  await page.goto('/painel');
  await expect(page.getByText('A edição foi bloqueada', { exact: false })).toBeVisible();
  await expect(page.locator('.panel-controls')).toHaveCount(0);
});

test('publishing one entity preserves unsaved edits in another tab', async ({ page }) => {
  const writes: Record<string, unknown>[] = [];
  await page.route('**/rest/v1/site_entities?**', async route => {
    if (route.request().method() === 'POST') writes.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('/painel');
  await page.getByRole('button', { name: 'Textos', exact: true }).click();
  await page.getByLabel('Nome da igreja').fill('Rascunho ainda não publicado');
  await page.getByRole('button', { name: 'Aparência', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar agora', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('publicado no site');
  expect(writes).toHaveLength(1);
  expect(writes[0].entity).toBe('tema');
  await page.getByRole('button', { name: 'Textos', exact: true }).click();
  await expect(page.getByLabel('Nome da igreja')).toHaveValue('Rascunho ainda não publicado');
});

test('history recovery never writes a published row', async ({ page }) => {
  const writes: Record<string, unknown>[] = [];
  await page.route('**/rest/v1/content_revisions?**', async route => {
    const isSnapshot = route.request().url().includes('snapshot');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(isSnapshot
      ? [{ entity: 'textos', snapshot: { brand: { name: 'Nome recuperado' } } }]
      : [{ id: 1, entity: 'textos', action: 'publish', note: '', created_at: '2026-09-19', created_by: 'editor@example.test' }]) });
  });
  await page.route('**/rest/v1/site_entities?**', async route => {
    if (route.request().method() === 'POST') writes.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('/painel');
  await page.getByRole('button', { name: 'Histórico', exact: true }).click();
  await page.getByRole('button', { name: 'Recuperar rascunho' }).click();
  await expect(page.getByRole('status')).toContainText('O site publicado não mudou');
  expect(writes).toHaveLength(1);
  expect(writes[0].state).toBe('draft');
  expect(writes[0].publish_at).toBeNull();
});

test('live preview receives edits without a database write', async ({ page }) => {
  await page.goto('/painel');
  await page.getByRole('button', { name: 'Textos', exact: true }).click();
  await page.getByLabel('Nome da igreja').fill('Prévia sem publicação');
  await expect(page.frameLocator('.panel-live-frame').locator('.site-header')).toContainText('Prévia sem publicação');
});
