import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Parser } from 'htmlparser2';
import { publicPages } from '../dist-ssr/entry-server.js';
import { legacyDestinations, SITE_ORIGIN } from '../src/data/contentCatalog.ts';

// Read one bounded HTML document at a time; never crawl external sites or a database.
const output = resolve('dist');
const pages = new Map();
const localLinks = [];
let assetCount = 0;

for (const page of publicPages) {
  const file = resolve(output, page.path.slice(1), 'index.html');
  assert.ok(file.startsWith(output + sep));
  assert.ok((await stat(file)).size < 512 * 1024, `HTML acima do orçamento: ${page.path}`);
  const html = await readFile(file, 'utf8');
  const ids = new Set();
  const assets = new Set();
  let headings = 0;
  let canonical = 0;
  let root = false;
  const parser = new Parser({
    onopentag(name, attributes) {
      if (name === 'h1') headings++;
      if (attributes.id) {
        assert.ok(!ids.has(attributes.id), `ID duplicado em ${page.path}: ${attributes.id}`);
        ids.add(attributes.id);
      }
      if (attributes.id === 'root') root = attributes['data-route'] === page.path;
      if (name === 'link' && attributes.rel === 'canonical') {
        canonical++;
        assert.equal(attributes.href, SITE_ORIGIN + page.path);
      }
      if (name === 'a' && attributes.href) {
        const url = new URL(attributes.href, SITE_ORIGIN + page.path);
        if (url.origin === SITE_ORIGIN) localLinks.push({ from: page.path, url });
        assert.ok(['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol), 'Protocolo de link não permitido.');
        if (attributes.target === '_blank') assert.match(attributes.rel ?? '', /\bnoopener\b/);
      }
      if (['img', 'script', 'video', 'source'].includes(name) && attributes.src?.startsWith('/')) assets.add(attributes.src);
      if (name === 'link' && attributes.rel === 'stylesheet' && attributes.href?.startsWith('/')) assets.add(attributes.href);
    },
  });
  parser.write(html);
  parser.end();
  assert.equal(headings, 1, `Uma única identificação principal em ${page.path}`);
  assert.equal(canonical, 1);
  assert.ok(root, `Pré-renderização ausente em ${page.path}`);
  assert.ok(ids.has('conteudo'));
  assert.match(html, /FINISH: unreviewed and undocumented is unfinished/);
  assert.doesNotMatch(html, /sb_secret_|postgresql:\/\/|openrouter\.ai/);
  for (const asset of assets) {
    const path = resolve(output, new URL(asset, SITE_ORIGIN).pathname.slice(1));
    assert.ok(path.startsWith(output + sep));
    assert.ok((await stat(path)).isFile(), `Arquivo não encontrado: ${asset}`);
    assetCount++;
  }
  pages.set(page.path, ids);
}

for (const { from, url } of localLinks) {
  if (/\.[a-z0-9]+$/i.test(url.pathname)) continue;
  let destination = url.pathname.replace(/\/$/, '') || '/';
  let hash = url.hash;
  const legacy = destination === '/' ? legacyDestinations[hash] : destination === '/blog' && hash === '#livros' ? '/livros' : undefined;
  if (legacy) {
    const redirected = new URL(legacy, SITE_ORIGIN);
    destination = redirected.pathname;
    hash = redirected.hash;
  }
  assert.ok(pages.has(destination), `Destino interno ausente: ${from} → ${destination}`);
  if (hash) assert.ok(pages.get(destination).has(decodeURIComponent(hash.slice(1))), `Âncora ausente: ${from} → ${destination}${hash}`);
}
const sitemap = await readFile(resolve(output, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>/g) ?? []).length, publicPages.length);
assert.doesNotMatch(sitemap, /gestao/);
console.log(`Build público validado: ${pages.size} páginas, ${localLinks.length} links internos e ${assetCount} referências locais. Nenhuma publicação realizada.`);
