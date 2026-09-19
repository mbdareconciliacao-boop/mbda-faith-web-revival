import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const settings = new URL('../src/data/siteSettings.ts', import.meta.url);
const panel = new URL('../src/pages/Panel.tsx', import.meta.url);

test('settings carry agenda, church, books and featured video', async () => {
  const data = await readFile(settings, 'utf8');
  assert.match(data, /agenda: \{ weekly: ScheduleItem\[\]; monthly: MonthlyItem\[\]/);
  assert.match(data, /church: \{/);
  assert.match(data, /books: SiteBook\[\]/);
  assert.match(data, /featuredVideo: FeaturedVideo \| null/);
  assert.match(data, /asFeaturedVideo/);
  assert.match(data, /YOUTUBE_ID/);
});

test('agenda, church, books and home read the published content', async () => {
  const files = [
    '../src/components/site/WeeklyPreview.tsx',
    '../src/components/site/ChurchSections.tsx',
    '../src/components/site/HomeHero.tsx',
    '../src/pages/Books.tsx',
  ];
  for (const rel of files) {
    const source = await readFile(new URL(rel, import.meta.url), 'utf8');
    assert.match(source, /useSiteSettings/, `${rel} nao usa useSiteSettings`);
  }
  const weekly = await readFile(new URL('../src/components/site/WeeklyPreview.tsx', import.meta.url), 'utf8');
  assert.match(weekly, /content\.agenda\.weekly/);
  const hero = await readFile(new URL('../src/components/site/HomeHero.tsx', import.meta.url), 'utf8');
  assert.match(hero, /featuredVideo/);
  const books = await readFile(new URL('../src/pages/Books.tsx', import.meta.url), 'utf8');
  assert.match(books, /content\.books/);
});

test('panel exposes agenda, church and books editors with draft/publish', async () => {
  const source = await readFile(panel, 'utf8');
  assert.match(source, /AgendaEditor/);
  assert.match(source, /ChurchEditor/);
  assert.match(source, /BooksEditor/);
  assert.match(source, /publish_entity/);
  const [agenda, books] = await Promise.all([
    readFile(new URL('../src/components/panel/AgendaEditor.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/panel/BooksEditor.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(agenda, /agenda\.weekly/);
  assert.match(agenda, /agenda\.monthly/);
  assert.match(books, /content\.books/);
  assert.match(books, /site-media/);
});
