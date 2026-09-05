import { ArrowUpRight, ChevronRight, MapPin } from "lucide-react";
import { CHURCH, MONTHLY_GATHERINGS, WEEKLY_SCHEDULE } from "../../data/church";
import { declarations } from "../../data/doctrine";

export function AboutChurch() {
  return <section className="section-space dark-section about-section" id="quem-somos" aria-labelledby="about-title">
    <div className="content-width about-layout">
      <div><h2 id="about-title">Uma igreja.<br />Uma família.<br /><span>Uma só fé.</span></h2>
        <a className="text-link" href="#declaracao-de-fe">Conheça nossa fé</a></div>
      <div className="reading-copy">
        <p>Somos o Ministério Bíblico da Reconciliação, uma comunidade cristã dedicada ao amor, à fé e à transformação espiritual. Nosso ministério é um espaço de encontro, reflexão e crescimento para famílias e para todos que desejam se aproximar de Deus.</p>
        <p>Nossa missão é proclamar a mensagem de Cristo, promovendo reconciliação com Deus e com o próximo. Buscamos viver princípios bíblicos de forma prática, com ensino fiel da Palavra e serviço à comunidade.</p>
        <p className="church-history"><strong>23+ anos de ministério.</strong> Uma história compartilhada com mais de 500 famílias, em Guarujá.</p>
        <a className="inline-link" href={CHURCH.maps} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden="true" /> Encontre nossa igreja <ArrowUpRight aria-hidden="true" /></a>
      </div>
    </div>
  </section>;
}
export function FaithDeclaration() {
  return <section id="declaracao-de-fe" className="section-space faith-section" aria-labelledby="faith-title">
    <div className="content-width faith-layout">
      <div><h2 id="faith-title">A Palavra é<br />nosso fundamento.</h2><span className="gold-rule" aria-hidden="true" /><p>Nossa declaração de fé reúne os princípios doutrinários que orientam o ministério. Leia cada ponto na íntegra.</p></div>
      <div className="doctrine-list">{declarations.map(item => <details key={item.id}><summary>{item.title}<ChevronRight aria-hidden="true" /></summary><p>{item.content}</p></details>)}</div>
    </div>
  </section>;
}
export function FullSchedule() {
  const sundaySchedule = WEEKLY_SCHEDULE.filter(item => item.short === "DOM");
  const wednesdaySchedule = WEEKLY_SCHEDULE.filter(item => item.short === "QUA");
  return <section id="agenda" className="section-space agenda-section" aria-labelledby="agenda-title">
    <div className="content-width">
      <div className="section-heading"><div><h2 id="agenda-title">Agenda semanal</h2><span className="gold-rule" aria-hidden="true" /></div><p>Oração, ensino e comunhão ao longo da semana. Horários locais de Guarujá, São Paulo.</p></div>
      <div className="agenda-layout">
        <div className="full-schedule">{WEEKLY_SCHEDULE.map(item=><div className="full-schedule-row" key={item.day+item.time}>
          <span>{item.day}</span><time>{item.time}</time><div><strong>{item.title}</strong><small>{item.format}</small></div>
        </div>)}<div className="monthly-gatherings" aria-label="Encontros mensais">
          <h3>Encontros mensais</h3>
          {MONTHLY_GATHERINGS.map(item => <p key={item.title}><span>{item.cadence}</span><strong>{item.title}</strong></p>)}
        </div><p className="fine-print">Programação atual. Em meses com calendário especial, confirme eventuais ajustes com a igreja.</p></div>
        <div className="agenda-poster-wrap">
          <aside className="agenda-poster" aria-labelledby="agenda-poster-title">
            <div className="agenda-poster-brand"><img src="/images/site/logo-evergreen.webp" width="64" height="64" alt="" /><span>Reconciliação</span></div>
            <h3 id="agenda-poster-title">Agenda semanal</h3>
            <div className="agenda-poster-group">
              <strong>DOM</strong><div>{sundaySchedule.map(item => <p key={item.time}><time>{item.time}</time><span>{item.title}</span></p>)}</div>
            </div>
            <div className="agenda-poster-group">
              <strong>QUA</strong><div>{wednesdaySchedule.map(item => <p key={item.time}><time>{item.time}</time><span>{item.title}</span></p>)}</div>
            </div>
            <div className="agenda-poster-special" aria-label="Encontros mensais">
              {MONTHLY_GATHERINGS.map(item => <p key={item.title}><span>{item.shortCadence}</span><strong>{item.title}</strong></p>)}
            </div>
            <blockquote>“Porque pela graça sois salvos, por meio da fé.”<cite>Efésios 2:8</cite></blockquote>
          </aside>
          <a href={CHURCH.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-link">Tire suas dúvidas sobre a visita <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  </section>;
}
export function FamilySpace() {
  return <section id="espaco-familia" className="section-space family-section" aria-labelledby="family-title">
    <div className="content-width family-layout">
      <div className="family-photo"><img src="/images/site/familia.webp" alt="Arte do Espaço Família do Ministério Bíblico da Reconciliação" width="1200" height="676" loading="lazy" decoding="async" /><p className="fine-print">Arte do acervo. Consulte a agenda atual para confirmar os encontros.</p></div>
      <div><h2 id="family-title">Crescer na fé.<br />Caminhar juntos.</h2><p>Valorizamos as famílias e celebramos cada momento de cuidado, discipulado e convivência cristã.</p><p>O Espaço Família é parte da nossa vida em comunidade. Conheça os encontros e converse conosco para participar.</p><a className="button button-blue" href={CHURCH.whatsapp} target="_blank" rel="noopener noreferrer">Fale com a igreja <ArrowUpRight aria-hidden="true" /></a></div>
    </div>
  </section>;
}
