import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { messages, studies, studySlugs, matchesSearch, legacyDestinations } from '../src/data/contentCatalog.ts';
import { recommendedBooks } from '../src/data/recommendedBooks.ts';
import { thessaloniansStudy } from '../src/data/tessalonians.ts';
import { renderDocument } from '../scripts/prerender.mjs';

test('catalog reuses existing study prose and gives each section a stable URL', () => {
  assert.equal(studies.length,8);
  assert.equal(new Set(studySlugs).size,8);
  for (const [index, study] of studies.entries()) {
    assert.equal(study.summary,thessaloniansStudy[index].summary);
    assert.equal(study.context,thessaloniansStudy[index].context);
    assert.match(study.href,/^\/estudos\/tessalonicenses\/[a-z-]+$/);
    assert.ok(study.readingMinutes > 0);
  }
});

test('catalog filters are accent insensitive and bound untrusted search input', () => {
  assert.ok(matchesSearch('fe esperanca','Fé, amor e esperança'));
  assert.ok(matchesSearch('nicodemus','Augustus Nicodemus'));
  assert.ok(!matchesSearch('batismo','Trabalho e testemunho'));
  assert.ok(matchesSearch(' '.repeat(120)+'missing','texto'));
  assert.ok(!matchesSearch('<script>','texto'));
});

test('all supplied books have external destinations and local full-cover assets', async () => {
  assert.equal(recommendedBooks.length,11);
  for (const book of recommendedBooks) {
    const url=new URL(book.href);
    assert.equal(url.protocol,'https:');
    assert.equal(url.username,'');
    assert.equal(url.password,'');
    assert.equal(url.searchParams.has('tag'),false);
    assert.ok(book.linkLabel);
    await access(new URL('../public'+book.image,import.meta.url));
  }
  assert.match(recommendedBooks.find(b=>b.slug==='pequeno-manual-de-doutrinas-basicas').purchaseNote,/não há oferta específica/);
});

test('message catalog does not manufacture authors, durations or publication dates', async () => {
  assert.ok(messages.length >= 1 && messages.length <= 21);
  for (const message of messages) {
    assert.equal('author' in message,false);
    assert.equal('duration' in message,false);
    assert.match(message.youtubeId,/^[A-Za-z0-9_-]{11}$/);
    assert.equal(message.video,undefined);
    for (const slug of message.relatedStudies) assert.ok(studySlugs.includes(slug));
    if (message.image.startsWith('/')) await access(new URL('../public'+message.image,import.meta.url));
    else assert.match(message.image, /^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\/hqdefault\.jpg$/);
  }
  const player=await readFile(new URL('../src/components/content/MessagePlayer.tsx',import.meta.url),'utf8');
  assert.match(player,/useState\(false\)/);
  assert.match(player,/!playing/);
  assert.match(player,/youtube-nocookie\.com/);
  assert.doesNotMatch(player,/<video|preload="none"/);
});

test('legacy anchors preserve access to institutional sections and news', () => {
  assert.equal(legacyDestinations['#agenda'],'/agenda');
  assert.equal(legacyDestinations['#reconnews'],'/noticias');
  assert.equal(legacyDestinations['#contato'],'/igreja#contato');
  assert.equal(legacyDestinations['#declaracao-de-fe'],'/igreja#declaracao-de-fe');
});

test('static document escapes metadata and records its route for safe hydration', () => {
  const result=renderDocument('<html><head><title>old</title><meta name="description" content="old" /></head><body><div id="root"></div></body></html>', '<main>Existing text</main>', { title:'A & B <test>',description:'" <script>',path:'/estudos',keywords:'test',ogTitle:'Test',ogDescription:'Test' });
  assert.ok(result.includes('A &amp; B &lt;test&gt;'));
  assert.ok(result.includes('&quot; &lt;script&gt;'));
  assert.ok(result.includes('data-route="/estudos"'));
  assert.ok(result.includes('<main>Existing text</main>'));
  assert.ok(result.includes('rel="canonical"'));
});
