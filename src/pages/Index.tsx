import SiteHeader from "../components/site/SiteHeader";
import HomeHero from "../components/site/HomeHero";
import WeeklyPreview from "../components/site/WeeklyPreview";
import EventGallery from "../components/site/EventGallery";
import SiteFooter from "../components/site/SiteFooter";
import { useSEO } from "../hooks/useSEO";
import { SEO_CONFIG } from "../constants";
import { ArrowRight } from "lucide-react";

export default function Index() {
  useSEO(SEO_CONFIG);
  return <>
    <SiteHeader />
    <main id="conteudo"><HomeHero /><WeeklyPreview /><EventGallery />
      <section className="home-more dark-section"><div className="content-width"><div><h2>Uma igreja.<br />Muitos caminhos de encontro.</h2><p>Conheça nossa fé e acompanhe o que acontece dentro e fora da comunidade.</p></div><nav aria-label="Vida da igreja"><a href="/igreja"><span><strong>Conheça a Reconciliação</strong><small>Nossa história, nossa fé e como falar com a igreja.</small></span><ArrowRight aria-hidden="true" /></a><a href="/noticias"><span><strong>ReconNews</strong><small>Notícias sobre fé, igreja e história, com fonte.</small></span><ArrowRight aria-hidden="true" /></a><a href="/agenda"><span><strong>Cultos e visita</strong><small>Horários, encontros mensais e como chegar.</small></span><ArrowRight aria-hidden="true" /></a></nav></div></section>
    </main>
    <SiteFooter />
  </>;
}
