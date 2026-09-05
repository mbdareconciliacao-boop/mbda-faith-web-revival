import { useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ContentLayout, { Breadcrumbs } from "../components/content/ContentLayout";
import MessagePlayer from "../components/content/MessagePlayer";
import ShareLink from "../components/content/ShareLink";
import { contentSEO, messages, studies } from "../data/contentCatalog";
import { useSEO } from "../hooks/useSEO";
import NotFound from "./NotFound";

export default function MessageDetail() {
  const { slug } = useParams();
  const message = messages.find(item => item.slug === slug);
  useSEO(contentSEO(message?.title ?? "Mensagem não encontrada", message?.description ?? "Este vídeo não está no acervo.", message ? `/mensagens/${message.slug}` : "/mensagens", message?.image));
  if (!message) return <NotFound />;
  const related = studies.filter(item => (message.relatedStudies as readonly string[]).includes(item.slug));
  return <ContentLayout><div className="watch-intro dark-section"><div className="content-width">
    <Breadcrumbs items={[{ label: "Mensagens", href: "/mensagens" }, { label: message.title }]} />
    <h1>{message.title}</h1>{message.date && <p><time dateTime={message.dateTime}>{message.date}</time> · Reconciliação</p>}
    <MessagePlayer key={message.slug} message={message} />
  </div></div>
    <div className="content-width watch-details"><article><h2>Sobre este vídeo</h2><p>{message.description}</p>
      {message.source && <a href={message.source} target="_blank" rel="noopener noreferrer" className="inline-link">Publicação no canal da igreja <ArrowUpRight aria-hidden="true" /></a>}
      <ShareLink key={message.slug} path={`/mensagens/${message.slug}`} />
    </article><aside className="continue-reading"><h2>Para continuar</h2>
      {related.length > 0 ? <><p>Leitura do nosso acervo sobre o mesmo tema. Não é uma transcrição da mensagem.</p>{related.map(item => <a key={item.slug} href={item.href}>{item.title}<ArrowRight aria-hidden="true" /></a>)}</> : <><p>Conheça os registros deste encontro e a vida da comunidade.</p><a href="/#comunidade">Fotos dos eventos <ArrowRight aria-hidden="true" /></a></>}
      <a href="/mensagens">Todas as mensagens <ArrowRight aria-hidden="true" /></a><a href="/estudos">Estudos bíblicos <ArrowRight aria-hidden="true" /></a>
    </aside></div>
  </ContentLayout>;
}
