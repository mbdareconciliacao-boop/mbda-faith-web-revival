import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SITE_ORIGIN } from '../src/data/contentCatalog.ts';

export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function renderDocument(template, html, seo) {
  let document = template.replace(/<title>.*?<\/title>/s, `<title>${escapeHTML(seo.title)}</title>`);
  const metadata = {
    description: seo.description, keywords: seo.keywords,
    'og:title': seo.ogTitle, 'og:description': seo.ogDescription,
    'og:url': SITE_ORIGIN + seo.path,
    'og:image': new URL(seo.image ?? '/images/site/logo-evergreen.webp', SITE_ORIGIN).href,
  };
  for (const [name, value] of Object.entries(metadata)) {
    document = document.replace(new RegExp(`<meta (?:name|property)="${name}"[^>]*>`), `<meta ${name.startsWith('og:') ? 'property' : 'name'}="${name}" content="${escapeHTML(value)}" />`);
  }
  document = document.replace('</head>', `<link rel="canonical" href="${escapeHTML(SITE_ORIGIN + seo.path)}" /><meta name="twitter:card" content="summary_large_image" /></head>`);
  return document.replace('<div id="root"></div>', `<div id="root" data-route="${escapeHTML(seo.path)}">${html}</div>`);
}

async function main() {
  const { publicPages, render } = await import('../dist-ssr/entry-server.js');
  if (publicPages.length > 100) throw new Error('Revise o orçamento da pré-renderização antes de ampliar o catálogo.');
  const output = resolve('dist');
  const template = await readFile(resolve(output, 'index.html'), 'utf8');
  const urls = [];
  for (const page of publicPages) {
    if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(page.path) || page.path === '/gestao') throw new Error('Rota pública inválida.');
    const destination = resolve(output, page.path.slice(1), 'index.html');
    if (!destination.startsWith(output + sep)) throw new Error('Saída fora de dist.');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, renderDocument(template, render(page.path), page.seo), 'utf8');
    urls.push(`<url><loc>${escapeHTML(SITE_ORIGIN + page.path)}</loc></url>`);
  }
  await writeFile(resolve(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, 'utf8');
  console.log(`Pré-renderização concluída: ${urls.length} páginas públicas, sem consultas externas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
