import { ArrowUpRight, ChevronRight, MapPin } from "lucide-react";
import { CHURCH } from "../../data/church";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export function AboutChurch() {
  const { content } = useSiteSettings();
  return <section className="section-space dark-section about-section" id="quem-somos" aria-labelledby="about-title">
    <div className="content-width about-layout">
      <div><h2 id="about-title">{content.church.aboutTitleLines.map((line, index) => <span key={line + index}>{index > 0 ? <br /> : null}{index === content.church.aboutTitleLines.length - 1 ? <span>{line}</span> : line}</span>)}</h2>
        <a className="text-link" href="#declaracao-de-fe">Conheça nossa fé</a></div>
      <div className="reading-copy">
        {content.church.aboutParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <p className="church-history">{content.church.historyNote}</p>
        <a className="inline-link" href={CHURCH.maps} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden="true" /> Encontre nossa igreja <ArrowUpRight aria-hidden="true" /></a>
      </div>
    </div>
  </section>;
}
export function FaithDeclaration() {
  const { content } = useSiteSettings();
  return <section id="declaracao-de-fe" className="section-space faith-section" aria-labelledby="faith-title">
    <div className="content-width faith-layout">
      <div><h2 id="faith-title">{content.church.faithTitleLines.map((line, index) => <span key={line + index}>{index > 0 ? <br /> : null}{line}</span>)}</h2><span className="gold-rule" aria-hidden="true" /><p>{content.church.faithLead}</p></div>
      <div className="doctrine-list">{content.church.declarations.map(item => <details key={item.id}><summary>{item.title}<ChevronRight aria-hidden="true" /></summary><p>{item.content}</p></details>)}</div>
    </div>
  </section>;
}
export function FullSchedule() {
  const { content } = useSiteSettings();
  const weekly = content.agenda.weekly;
  const sundaySchedule = weekly.filter(item => item.short === "DOM");
  const wednesdaySchedule = weekly.filter(item => item.short === "QUA");
  return <section id="agenda" className="section-space agenda-section" aria-labelledby="agenda-title">
    <div className="content-width">
      <div className="section-heading"><div><h2 id="agenda-title">{content.agenda.heading}</h2><span className="gold-rule" aria-hidden="true" /></div><p>{content.agenda.lead}</p></div>
      <div className="agenda-layout">
        <div className="full-schedule">{weekly.map(item=><div className="full-schedule-row" key={item.day+item.time}>
          <span>{item.day}</span><time>{item.time}</time><div><strong>{item.title}</strong><small>{item.format}</small></div>
        </div>)}<div className="monthly-gatherings" aria-label="Encontros mensais">
          <h3>Encontros mensais</h3>
          {content.agenda.monthly.map(item => <p key={item.title}><span>{item.cadence}</span><strong>{item.title}</strong></p>)}
        </div><p className="fine-print">Programação atual. Em meses com calendário especial, confirme eventuais ajustes com a igreja.</p></div>
        <div className="agenda-poster-wrap">
          <aside className="agenda-poster" aria-labelledby="agenda-poster-title">
            <div className="agenda-poster-brand"><img src={content.brand.logo} width="64" height="64" alt="" /><span>{content.brand.name}</span></div>
            <h3 id="agenda-poster-title">{content.agenda.heading}</h3>
            <div className="agenda-poster-group">
              <strong>DOM</strong><div>{sundaySchedule.map(item => <p key={item.time}><time>{item.time}</time><span>{item.title}</span></p>)}</div>
            </div>
            <div className="agenda-poster-group">
              <strong>QUA</strong><div>{wednesdaySchedule.map(item => <p key={item.time}><time>{item.time}</time><span>{item.title}</span></p>)}</div>
            </div>
            <div className="agenda-poster-special" aria-label="Encontros mensais">
              {content.agenda.monthly.map(item => <p key={item.title}><span>{item.shortCadence}</span><strong>{item.title}</strong></p>)}
            </div>
            <blockquote>{content.agenda.posterQuote}<cite>{content.agenda.posterCite}</cite></blockquote>
          </aside>
          <a href={CHURCH.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-link">Tire suas dúvidas sobre a visita <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  </section>;
}
export function FamilySpace() {
  const { content } = useSiteSettings();
  return <section id="espaco-familia" className="section-space family-section" aria-labelledby="family-title">
    <div className="content-width family-layout">
      <div className="family-photo"><img src="/images/site/familia.webp" alt="Arte do Espaço Família do Ministério Bíblico da Reconciliação" width="1200" height="676" loading="lazy" decoding="async" /><p className="fine-print">Arte do acervo. Consulte a agenda atual para confirmar os encontros.</p></div>
      <div><h2 id="family-title">{content.church.familyTitleLines.map((line, index) => <span key={line + index}>{index > 0 ? <br /> : null}{line}</span>)}</h2>{content.church.familyParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<a className="button button-blue" href={CHURCH.whatsapp} target="_blank" rel="noopener noreferrer">Fale com a igreja <ArrowUpRight aria-hidden="true" /></a></div>
    </div>
  </section>;
}
