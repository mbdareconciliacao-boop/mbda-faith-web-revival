import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ContentLayout, { Breadcrumbs, ContentTabs } from "../components/content/ContentLayout";
import CatalogSearch from "../components/content/CatalogSearch";
import { recommendedBooks } from "../data/recommendedBooks";
import { contentSEO, matchesSearch } from "../data/contentCatalog";
import { useSEO } from "../hooks/useSEO";

export default function Books() {
  useSEO(contentSEO("Livros recomendados", "As leituras recomendadas pela igreja, com capas, autores e links para encontrar livros em editoras e livrarias.", "/livros"));
  const [params, setParams] = useSearchParams();
  const query = (params.get("busca") ?? "").slice(0, 120);
  const books = recommendedBooks.filter(book => matchesSearch(query, book.title, book.author, book.description));
  return <ContentLayout>
    <header className="catalog-header dark-section"><div className="content-width"><Breadcrumbs items={[{ label: "Livros recomendados" }]} /><h1>Livros recomendados</h1><p>Encontre os títulos indicados pela igreja e onde comprá-los.</p><ContentTabs /></div></header>
    <div className="content-width catalog-body">
      <CatalogSearch label="Buscar livro, autor ou assunto" value={query} count={books.length} onChange={value => setParams(value ? { busca: value } : {}, { replace: true, preventScrollReset: true })} />
      <details className="purchase-disclosure"><summary>Sobre as compras e links externos</summary><p>Os botões abrem editoras, livrarias ou buscas identificadas. A compra acontece fora deste site, sem links de afiliado. Confira preço, estoque, edição e vendedor antes de comprar.</p></details>
      <div id="catalog-results" className="book-catalog">{books.map(book => <article className="book-entry" id={book.slug} key={book.slug}>
        <div className="book-entry-cover"><img src={book.image} srcSet={book.imageSrcSet} sizes="(max-width: 640px) 112px, 180px" width="480" height="854" alt={`Capa ou arte de divulgação de ${book.title}`} loading="lazy" decoding="async" /></div>
        <div><h2>{book.title}</h2><p className="book-entry-author">{book.author}</p>
          {book.href ? <a className="button button-blue book-purchase" href={book.href} target="_blank" rel="noopener noreferrer">{book.linkLabel ?? "Onde encontrar"}<ArrowUpRight aria-hidden="true" /></a> : <p className="purchase-note">Link de compra ainda não confirmado.</p>}
          {book.purchaseNote && <p className="purchase-note">{book.purchaseNote}</p>}
          <p>{book.description}</p>
          {book.slug === "tessalonicenses-visao-de-uma-igreja-local" && <a className="inline-link book-study-link" href="/blog">Estudo disponível no site <ArrowRight aria-hidden="true" /></a>}
        </div>
      </article>)}</div>
      {!books.length && <div className="empty-state"><h2>Nenhum livro encontrado.</h2><p>Tente o sobrenome do autor ou uma palavra do título.</p><button type="button" className="button button-blue" onClick={() => setParams({})}>Ver todos os livros</button></div>}
    </div>
  </ContentLayout>;
}
