import { ArrowRight, Play } from "lucide-react";
import { messages } from "../../data/contentCatalog";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export default function HomeHero() {
  const { content } = useSiteSettings();
  const featured = messages[0];
  return <section className="home-hero editorial-hero" aria-labelledby="welcome-title">
    <div className="content-width editorial-hero-grid">
      <div className="editorial-hero-copy"><h1 id="welcome-title">{content.home.heroLines.map((line, index) => <span key={line + index}>{index > 0 ? <br /> : null}{index === 1 ? <span>{line}</span> : line}</span>)}</h1>
        <p>{content.home.heroSubtitle}</p>
        <a className="button button-gold" href="/mensagens">{content.home.heroButton} <ArrowRight aria-hidden="true" /></a>
        <div className="hero-church-signature"><img src={content.brand.logo} alt={content.brand.name} width="72" height="72" /><p>{content.home.signatureTitle}<br /><span>{content.home.signatureNote}</span></p></div>
      </div>
      <article className="hero-message"><a className="hero-message-image" href={`/mensagens/${featured.slug}`} aria-label={`Assistir ${featured.title}`}><img src={featured.image} alt={featured.imageAlt} width="720" height="405" decoding="async" /><span className="play-symbol"><Play aria-hidden="true" /></span><span className="hero-watch-label">Mensagem mais recente</span></a>
        <div className="hero-message-caption"><time dateTime={featured.dateTime}>{featured.date}</time><h2><a href={`/mensagens/${featured.slug}`}>{featured.title}</a></h2><p>{featured.description}</p></div>
      </article>
    </div>
    <nav className="home-paths content-width" aria-label="Encontre o que procura">{content.home.paths.map(path => <a key={path.href + path.label} href={path.href}><span>{path.kicker}</span>{path.label} <ArrowRight aria-hidden="true" /></a>)}</nav>
  </section>;
}
