import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Mic2,
} from "lucide-react";
import {
  THESSALONIANS_EVENT,
  THESSALONIANS_SOURCES,
  thessaloniansStudy,
} from "../data/tessalonians";
import { contentSEO, studies, studySlugs } from "../data/contentCatalog";
import { Breadcrumbs } from "./content/ContentLayout";
import ShareLink from "./content/ShareLink";
import NotFound from "../pages/NotFound";
import { useSEO } from "../hooks/useSEO";
import SiteFooter from "./site/SiteFooter";
import SiteHeader from "./site/SiteHeader";

const BLOG_SEO = {
  title: "Tessalonicenses · Escola Bíblica da Reconciliação",
  description:
    "Guia de estudo autoral sobre 1 e 2 Tessalonicenses: contexto, palavras-chave, ideias centrais e aplicações para a igreja local.",
  keywords:
    "Tessalonicenses, escola bíblica, EBD, estudo bíblico, volta de Cristo, igreja local, Ministério Bíblico da Reconciliação",
  ogTitle: "Tessalonicenses · Visão de uma igreja local",
  ogDescription:
    "Acompanhe a nova série da Escola Bíblica com um guia de leitura sobre fé, santidade, comunhão e a volta de Cristo.",
};

export default function Blog() {
  const { sectionSlug } = useParams();
  const navigate = useNavigate();
  const index = studySlugs.findIndex(slug => slug === sectionSlug);
  const selected = Math.max(0, index);
  const section = thessaloniansStudy[selected];
  const current = studies[selected];
  useSEO(sectionSlug ? contentSEO(section.title, section.summary, current.href, "/images/site/blog/tessalonicenses-evento-900.webp") : { ...BLOG_SEO, path: "/blog", image: "/images/site/blog/tessalonicenses-evento-900.webp" });
  const article = useRef<HTMLElement>(null);
  const previous = useRef(selected);

  useEffect(() => {
    if (previous.current !== selected) {
      article.current?.scrollIntoView({ block: "start" });
      article.current?.focus({ preventScroll: true });
    }
    previous.current = selected;
  }, [selected]);

  const chooseSection = (index: number) => {
    if (index >= 0 && index < studies.length) navigate(studies[index].href);
  };

  if (sectionSlug && index < 0) return <NotFound />;

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className={sectionSlug ? "blog-page reading-page" : "blog-page"}>
        {sectionSlug ? <div className="content-width reading-breadcrumb"><Breadcrumbs items={[{ label: "Estudos", href: "/estudos" }, { label: "Tessalonicenses", href: "/blog" }, { label: section.navLabel }]} /></div> : <header className="blog-intro dark-section">
          <div className="content-width blog-hero-grid">
            <div className="blog-hero-copy">
              <a className="inline-link" href="/estudos">
                Todos os estudos
              </a>
              <h1>Tessalonicenses</h1>
              <p className="blog-subtitle">Visão de uma igreja local</p>
              <p className="blog-introduction">
                Uma jornada pelas duas cartas de Paulo para descobrir como fé,
                amor e esperança formam uma igreja firme — enquanto ela vive o
                presente à luz da volta de Cristo.
              </p>
              <a className="button button-gold start-study" href={studies[0].href}>Começar a leitura <ChevronRight aria-hidden="true" /></a>

              <ul className="study-event-details" aria-label="Informações da Escola Bíblica">
                <li>
                  <CalendarDays aria-hidden="true" />
                  <span>
                    <small>Aula inaugural</small>
                    <strong>{THESSALONIANS_EVENT.date}</strong>
                  </span>
                </li>
                <li>
                  <Clock3 aria-hidden="true" />
                  <span>
                    <small>Domingo</small>
                    <strong>{THESSALONIANS_EVENT.time}</strong>
                  </span>
                </li>
                <li>
                  <Mic2 aria-hidden="true" />
                  <span>
                    <small>Ministração</small>
                    <strong>{THESSALONIANS_EVENT.teacher}</strong>
                  </span>
                </li>
              </ul>
            </div>

            <figure className="blog-event-art">
              <img
                src="/images/site/blog/tessalonicenses-evento-480.webp"
                srcSet="/images/site/blog/tessalonicenses-evento-480.webp 480w, /images/site/blog/tessalonicenses-evento-900.webp 900w"
                sizes="(max-width: 640px) calc(100vw - 40px), 340px"
                width="900"
                height="1600"
                alt="Arte da Escola Bíblica sobre a primeira e a segunda cartas de Paulo aos Tessalonicenses"
                decoding="async"
              />
              <figcaption>Escola Bíblica · Ministério Bíblico da Reconciliação</figcaption>
            </figure>
          </div>
        </header>}

        {sectionSlug ? <div className="content-width blog-layout section-space">
          <aside className="study-sidebar">
            <nav className="reflection-index" aria-label="Roteiro do estudo">
              <h2>Roteiro de estudo</h2>
              {thessaloniansStudy.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  aria-current={index === selected ? "step" : undefined}
                  onClick={() => chooseSection(index)}
                >
                  <span>{item.lessonRange}</span>
                  {item.navLabel}
                </button>
              ))}
            </nav>

            <section className="study-sources" aria-labelledby="study-sources-title">
              <h2 id="study-sources-title">Para continuar</h2>
              <p>
                Esta síntese autoral foi construída a partir do sumário e da
                amostra oficial. Ela acompanha a leitura, mas não substitui a revista.
              </p>
              <a href={THESSALONIANS_SOURCES.publisher} target="_blank" rel="noopener noreferrer">
                Revista na editora oficial <ExternalLink aria-hidden="true" />
              </a>
              <a href={THESSALONIANS_SOURCES.sample} target="_blank" rel="noopener noreferrer">
                Ler a amostra oficial <ExternalLink aria-hidden="true" />
              </a>
              <a href={THESSALONIANS_SOURCES.perlego} target="_blank" rel="noopener noreferrer">
                Consultar no Perlego <ExternalLink aria-hidden="true" />
              </a>
            </section>
          </aside>

          <article ref={article} tabIndex={-1} className="reflection-article">
            <p className="sr-only" aria-live="polite">
              Agora lendo {section.title}
            </p>
            <h1>{section.title}</h1>
            <div className="reading-tools"><span>{current.readingMinutes} min de leitura estimada</span><ShareLink key={current.slug} path={current.href} /></div>
            <p className="reflection-verse">
              <span>{section.lessonRange}</span>
              {section.reading}
            </p>
            <p className="reflection-lead">{section.summary}</p>

            <div className="study-keywords" aria-label="Palavras-chave">
              {section.keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>

            <h2>Contexto</h2>
            <p>{section.context}</p>

            <h2>Ideias-chave</h2>
            <ul className="study-key-points">
              {section.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <section className="study-application" aria-labelledby="study-application-title">
              <h2 id="study-application-title">Para viver a Palavra</h2>
              <p>{section.application}</p>
            </section>

            <h2>Para conversar em classe</h2>
            <ol className="study-questions">
              {section.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>

            <nav className="reflection-navigation" aria-label="Continuar o estudo">
              <button
                className="button button-outline"
                type="button"
                disabled={selected === 0}
                onClick={() => chooseSection(selected - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Anterior
              </button>
              <span>
                {selected + 1} de {thessaloniansStudy.length}
              </span>
              <button
                className="button button-outline"
                type="button"
                disabled={selected === thessaloniansStudy.length - 1}
                onClick={() => chooseSection(selected + 1)}
              >
                Próximo
                <ChevronRight aria-hidden="true" />
              </button>
            </nav>
          </article>
        </div> : <section className="content-width series-contents section-space" aria-labelledby="series-contents-title"><h2 id="series-contents-title">Encontre seu ponto de leitura.</h2><p>Oito partes para acompanhar a série. Escolha uma delas para ler com calma.</p><ol>{studies.map(item => <li key={item.slug}><a href={item.href}><span>{item.lessonRange}</span><strong>{item.navLabel}</strong><ChevronRight aria-hidden="true" /></a></li>)}</ol><p className="fine-print">Esta síntese autoral foi construída a partir do sumário e da amostra oficial. Ela acompanha a leitura, mas não substitui a revista.</p><a className="inline-link" href={THESSALONIANS_SOURCES.publisher} target="_blank" rel="noopener noreferrer">Encontrar a revista na editora <ExternalLink aria-hidden="true" /></a></section>}

        <section id="livros" className="book-stand dark-section" aria-labelledby="book-stand-title">
          <div className="content-width">
            <div className="book-stand-heading">
              <h2 id="book-stand-title">Livros para ir mais fundo.</h2>
              <div><p>Encontre as leituras recomendadas, os autores e onde comprar. O catálogo completo tem sua própria página.</p><a className="button button-gold" href="/livros">Ver livros recomendados <ChevronRight aria-hidden="true" /></a></div>
            </div>

          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
