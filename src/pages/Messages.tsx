import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ContentLayout, { Breadcrumbs, ContentTabs } from "../components/content/ContentLayout";
import CatalogSearch from "../components/content/CatalogSearch";
import { contentSEO, messages, externalMessages, matchesSearch } from "../data/contentCatalog";
import { CHURCH } from "../data/church";
import { useSEO } from "../hooks/useSEO";

export default function Messages() {
  useSEO(contentSEO("Mensagens", "Assista às mensagens e celebrações da Reconciliação. Encontre também estudos em vídeo já selecionados no nosso acervo.", "/mensagens"));
  const [params, setParams] = useSearchParams();
  const query = (params.get("busca") ?? "").slice(0, 120);
  const filtered = messages.filter(item => matchesSearch(query, item.title, item.description, ...item.topics));
  const external = externalMessages.filter(item => matchesSearch(query, item.title, item.author));
  return <ContentLayout>
    <header className="catalog-header dark-section"><div className="content-width">
      <Breadcrumbs items={[{ label: "Mensagens" }]} /><h1>Mensagens</h1>
      <p>Mensagens e celebrações da nossa igreja. Escolha um vídeo e assista no seu tempo.</p><ContentTabs />
    </div></header>
    <div className="content-width catalog-body">
      <CatalogSearch label="Buscar por título ou assunto" value={query} count={filtered.length + external.length} onChange={value => setParams(value ? { busca: value } : {}, { replace: true, preventScrollReset: true })} />
      <div id="catalog-results">
        {filtered.length > 0 && <section aria-labelledby="church-messages-title"><h2 className="catalog-section-title" id="church-messages-title">Da Reconciliação</h2>
          <div className="message-grid">{filtered.map(message => <article className="message-preview" key={message.slug}>
            <a href={`/mensagens/${message.slug}`} className="message-preview-image" aria-label={`Assistir ${message.title}`}><img src={message.image} alt={message.imageAlt} width="720" height="405" loading="lazy" decoding="async" /><span className="play-symbol"><Play aria-hidden="true" /></span></a>
            <div className="content-meta">{message.date ? <time dateTime={message.dateTime}>{message.date}</time> : <span>Devocional</span>}</div>
            <h3><a href={`/mensagens/${message.slug}`}>{message.title}</a></h3><p>{message.description}</p>
            <a className="inline-link" href={`/mensagens/${message.slug}`}>Assistir à mensagem <ArrowRight aria-hidden="true" /></a>
          </article>)}</div>
        </section>}
        {external.length > 0 && <section className="external-messages" aria-labelledby="external-title"><h2 className="catalog-section-title" id="external-title">De outros ministérios</h2><p>Vídeos selecionados que já fazem parte do nosso acervo. Abrem no YouTube.</p>
          <div className="external-message-list">{external.map(item => <a key={item.id} href={`https://www.youtube.com/watch?v=${item.id}`} target="_blank" rel="noopener noreferrer"><img src={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} alt="" loading="lazy" width="160" height="90" referrerPolicy="no-referrer" /><span><strong>{item.title}</strong><small>{item.author}</small></span><ArrowUpRight aria-hidden="true" /></a>)}</div>
        </section>}
        {filtered.length + external.length === 0 && <div className="empty-state"><h2>Nenhum vídeo encontrado.</h2><p>Tente outro título ou assunto.</p><button type="button" className="button button-blue" onClick={() => setParams({})}>Ver todos os vídeos</button></div>}
      </div>
      <div className="catalog-close"><h2>Continue no canal da igreja.</h2><a className="button button-blue" href={CHURCH.youtube} target="_blank" rel="noopener noreferrer">Mais mensagens no YouTube <ArrowUpRight aria-hidden="true" /></a></div>
    </div>
  </ContentLayout>;
}
