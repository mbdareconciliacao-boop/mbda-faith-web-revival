import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const text = path => readFile(new URL(path, root), 'utf8');

test('scheduled operations stay inside the free-resource budget', async () => {
  const [health, news, security, backup] = await Promise.all([
    text('.github/workflows/site-healthcheck.yml'),
    text('.github/workflows/news-scraper.yml'),
    text('.github/workflows/security.yml'),
    text('.github/workflows/backup.yml'),
  ]);

  assert.match(health, /cron: '15 \*\/3 \* \* \*'/);
  assert.match(news, /cron: '0 10 \* \* \*'/);
  assert.doesNotMatch(news, /0 10,22/);
  for (const generated of ['src/data/christian_news.json', 'src/data/youtubeMessages.ts']) {
    assert.match(security, new RegExp(generated.replaceAll('.', '\\.')));
  }
  assert.match(backup, /git archive --format=tar\.gz/);
  assert.match(backup, /retention-days: 14/);
  assert.doesNotMatch(backup, /git bundle|fetch-depth: 0|apt-get/);
});

test('legacy source videos are not kept in the public repository', async () => {
  for (const name of ['aobrigatoriedade-de-evangelizar.mp4', 'devocional-ofrutodafe.mp4']) {
    await assert.rejects(access(new URL(`public/videos/${name}`, root)));
  }
});

test('repository automation belongs to the church account', async () => {
  const [owners, dependabot] = await Promise.all([
    text('.github/CODEOWNERS'),
    text('.github/dependabot.yml'),
  ]);
  assert.match(owners, /@mbdareconciliacao-boop/);
  assert.doesNotMatch(dependabot, /carlitosdj/i);
});
