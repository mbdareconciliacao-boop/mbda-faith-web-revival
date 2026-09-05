import { ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ContentLayout, { Breadcrumbs, ContentTabs } from "../components/content/ContentLayout";
import CatalogSearch from "../components/content/CatalogSearch";
import { contentSEO, studies, matchesSearch } from "../data/contentCatalog";
import { useSEO } from "../hooks/useSEO";

export default function Studies() {
  useSEO(contentSEO("Estudos bíblicos", "Literatura em destaque aplicada: encontre o roteiro de Tessalonicenses por tema e acompanhe a leitura bíblica.", "/estudos"));
  const [params, setParams] = useSearchParams();
  const query = (params.get("busca") ?? "").slice(0, 120);
  const filtered = studies.filter(item => matchesSearch(query, item.title, item.reading, item.summary, ...item.keywords));
  return <ContentLayout>
    <header className="catalog-header dark-section"><div className="content-width"><Breadcrumbs items={[{ label: "Estudos" }]} /><h1>Estudos bíblicos</h1><p>Literatura em destaque aplicada. Encontre um tema ou acompanhe o roteiro desde o início.</p><ContentTabs /></div></header>
    <div className="content-width catalog-body">
      <CatalogSearch label="Buscar no roteiro: tema, palavra ou passagem bíblica" value={query} onChange={value => setParams(value ? { busca: value } : {}, { replace: true, preventScrollReset: true })} count={filtered.length} />
      <div className="topic-links" aria-label="Explorar por assunto">{["esperança", "missão", "santidade", "discernimento"].map(topic => <button type="button" aria-pressed={query === topic} key={topic} onClick={() => setParams(query === topic ? {} : { busca: topic }, { replace: true, preventScrollReset: true })}>{topic}</button>)}</div>
      {!query.trim() && <section className="study-series-feature" aria-labelledby="series-title"><img src="/images/site/blog/tessalonicenses-evento-480.webp" alt="Arte da Escola Bíblica de Tessalonicenses" width="480" height="854" /><div><h2 id="series-title">Tessalonicenses</h2><p>Visão de uma igreja local · Escola Bíblica</p><a className="button button-blue" href="/blog">Conhecer a série <ArrowRight aria-hidden="true" /></a></div></section>}
      <div id="catalog-results" className="study-results">{filtered.map(item => <article key={item.slug}><div className="study-result-meta"><span>{item.lessonRange}</span><small>{item.readingMinutes} min de leitura estimada</small></div><div><h2><a href={item.href}>{item.title}</a></h2><p>{item.reading}</p><div className="keyword-line">{item.keywords.slice(0, 3).join(" · ")}</div></div><a href={item.href} className="study-result-link" aria-label={`Ler ${item.title}`}><ArrowRight aria-hidden="true" /></a></article>)}</div>
      {!filtered.length && <div className="empty-state"><h2>Nenhum estudo encontrado.</h2><p>Tente uma palavra mais simples, como fé ou esperança.</p><button type="button" className="button button-blue" onClick={() => setParams({})}>Ver o roteiro completo</button></div>}
    </div>
  </ContentLayout>;
}
