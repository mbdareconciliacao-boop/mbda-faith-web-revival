import { ArrowUpRight } from "lucide-react";
import ContentLayout, { Breadcrumbs } from "../components/content/ContentLayout";
import { FullSchedule } from "../components/site/ChurchSections";
import { CHURCH } from "../data/church";
import { contentSEO } from "../data/contentCatalog";
import { useSEO } from "../hooks/useSEO";

export default function Agenda() {
  useSEO(contentSEO("Cultos e visita", "Domingos às 8h, 9h e 11h e quartas às 20h. Consulte os encontros da Reconciliação e como chegar em Guarujá.", "/agenda"));
  return <ContentLayout><header className="catalog-header compact-header dark-section"><div className="content-width"><Breadcrumbs items={[{ label: "Cultos e visita" }]} /><h1>Cultos e visita</h1><nav className="section-index" aria-label="Nesta página"><a href="#agenda">Horários dos cultos</a><a href="#como-chegar">Como chegar</a><a href="/#comunidade">Eventos da Reconciliação</a></nav></div></header><FullSchedule /><section className="visit-address content-width" id="como-chegar"><div><h2>Venha nos conhecer.</h2><address>{CHURCH.address}<br />{CHURCH.neighborhood}<br />{CHURCH.city}</address></div><div><a className="button button-blue" href={CHURCH.maps} target="_blank" rel="noopener noreferrer">Abrir o mapa <ArrowUpRight aria-hidden="true" /></a><a className="inline-link" href={CHURCH.whatsapp} target="_blank" rel="noopener noreferrer">Conversar com a igreja <ArrowUpRight aria-hidden="true" /></a></div></section></ContentLayout>;
}
