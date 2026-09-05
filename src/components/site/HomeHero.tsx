import { ArrowRight, Play } from "lucide-react";
import { messages } from "../../data/contentCatalog";

export default function HomeHero() {
  const featured = messages[0];
  return <section className="home-hero editorial-hero" aria-labelledby="welcome-title">
    <div className="content-width editorial-hero-grid">
      <div className="editorial-hero-copy"><h1 id="welcome-title">A fé nos reúne.<br /><span>A Palavra</span><br />nos acompanha.</h1>
        <p>Mensagens para ouvir, estudos para aprofundar e uma comunidade para caminhar junto.</p>
        <a className="button button-gold" href="/mensagens">Explore as mensagens <ArrowRight aria-hidden="true" /></a>
        <div className="hero-church-signature"><img src="/images/site/logo-23anos.webp" alt="Reconciliação — 23 anos" width="72" height="72" /><p>Ministério Bíblico da Reconciliação<br /><span>Há mais de 23 anos, em Guarujá.</span></p></div>
      </div>
      <article className="hero-message"><a className="hero-message-image" href={`/mensagens/${featured.slug}`} aria-label={`Assistir ${featured.title}`}><img src={featured.image} alt={featured.imageAlt} width="720" height="405" /><span className="play-symbol"><Play aria-hidden="true" /></span><span className="hero-watch-label">Assista no canal da igreja</span></a>
        <div className="hero-message-caption"><time dateTime={featured.dateTime}>{featured.date}</time><h2><a href={`/mensagens/${featured.slug}`}>{featured.title}</a></h2><p>{featured.description}</p></div>
      </article>
    </div>
    <nav className="home-paths content-width" aria-label="Encontre o que procura"><a href="/mensagens"><span>Quero assistir</span>Mensagens <ArrowRight aria-hidden="true" /></a><a href="/estudos"><span>Quero aprofundar</span>Estudos bíblicos <ArrowRight aria-hidden="true" /></a><a href="/livros"><span>Quero ler</span>Livros recomendados <ArrowRight aria-hidden="true" /></a></nav>
  </section>;
}
