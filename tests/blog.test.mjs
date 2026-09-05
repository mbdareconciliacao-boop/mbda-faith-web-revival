import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const blogPath = new URL('../src/components/Blog.tsx', import.meta.url);
const studyPath = new URL('../src/data/tessalonians.ts', import.meta.url);

test('blog replaces the old series with a sourced Thessalonians study', async () => {
  const [blog, study] = await Promise.all([
    readFile(blogPath, 'utf8'),
    readFile(studyPath, 'utf8'),
  ]);

  assert.doesNotMatch(blog, /Abrigo no temporal|reflections/);
  assert.match(blog, /Tessalonicenses/);
  assert.match(blog, /síntese autoral/i);
  assert.match(blog, /não substitui a revista/i);
  assert.match(study, /Pr\. Luiz Carlos Aparício/);
  const sections = study.slice(study.indexOf('export const thessaloniansStudy'));
  assert.equal((sections.match(/navLabel:/g) ?? []).length, 8);
  assert.match(study, /loja\.editoracristaevangelica\.com\.br/);
  assert.match(study, /portal\.editoracristaevangelica\.com\.br/);
  assert.match(study, /perlego\.com\/book\/3957744/);
});

test('blog event art has responsive, repository-local derivatives', async () => {
  const blog = await readFile(blogPath, 'utf8');

  assert.match(blog, /tessalonicenses-evento-480\.webp/);
  assert.match(blog, /tessalonicenses-evento-900\.webp/);
  assert.match(blog, /srcSet=/);
  await Promise.all([
    access(new URL('../public/images/site/blog/tessalonicenses-evento-480.webp', import.meta.url)),
    access(new URL('../public/images/site/blog/tessalonicenses-evento-900.webp', import.meta.url)),
  ]);
});

test('study navigation remains keyboard and assistive-technology friendly', async () => {
  const blog = await readFile(blogPath, 'utf8');

  assert.match(blog, /type="button"/);
  assert.match(blog, /aria-current=/);
  assert.match(blog, /aria-live="polite"/);
  assert.match(blog, /tabIndex=\{-1\}/);
});

test('the books catalog is directly linked and legacy blog anchors remain supported', async () => {
  const [blog, header, books, routes, catalog] = await Promise.all([
    readFile(blogPath, 'utf8'),
    readFile(new URL('../src/components/site/SiteHeader.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/data/recommendedBooks.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/SiteRoutes.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/Books.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(header, /\["\/livros", "Livros"\]/);
  assert.match(blog, /id="livros"/);
  assert.match(routes, /pathname === "\/blog" && hash === "#livros" \? "\/livros"/);
  assert.match(catalog, /books\.map/);
  assert.match(books, /href\?: string/);
  assert.match(books, /Tessalonicenses — visão de uma igreja local/);
});

test('the books stand includes the supplied collection as optimized local covers', async () => {
  const books = await readFile(new URL('../src/data/recommendedBooks.ts', import.meta.url), 'utf8');
  const suppliedCovers = [
    'biblia-e-seus-interpretes',
    'comentario-novo-testamento',
    'cultura-biblica-antigo-testamento',
    'doutrinas-da-biblia',
    'duas-naturezas-redentor',
    'geografia-historica-mundo-biblico',
    'pequeno-manual-doutrinas',
    'plano-de-deus-mundo',
    'principios-interpretacao-biblica',
    'ser-de-deus-e-suas-obras',
  ];
  for (const cover of suppliedCovers) {
    assert.match(books, new RegExp(`/images/site/livros/${cover}-480\\.webp`));
    await access(new URL(`../public/images/site/livros/${cover}-480.webp`, import.meta.url));
  }
});

test('the homepage promotes the current literature feature without fixing a book title', async () => {
  const [preview,sections]=await Promise.all([
    readFile(new URL('../src/components/site/WeeklyPreview.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/site/ChurchSections.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(preview,/href="\/blog"/);
  assert.match(preview,/Literatura em destaque aplicada/i);
  assert.doesNotMatch(preview,/Estude Tessalonicenses/);
  assert.doesNotMatch(sections,/Estude Tessalonicenses/);
});

test('book recommendations preserve full covers and exclude editorial setup instructions', async () => {
  const [blog, styles] = await Promise.all([
    readFile(blogPath, 'utf8'),
    readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(blog, /envie o título|sem alterar a página|book-stand-note/);
  assert.match(styles, /\.recommended-book-cover img\s*\{[^}]*object-fit:\s*contain/);
});
