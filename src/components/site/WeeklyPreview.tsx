import { BookOpenText, CalendarDays, ChevronRight } from "lucide-react";
import { WEEKLY_SCHEDULE } from "../../data/church";

export default function WeeklyPreview() {
  return <section className="weekly-preview" aria-labelledby="weekly-preview-title">
    <div className="content-width weekly-grid">
      <div>
        <h2 id="weekly-preview-title">A semana na Reconciliação</h2>
        <span className="gold-rule" aria-hidden="true" />
        <div className="schedule-preview">
          {WEEKLY_SCHEDULE.map(item => <a href="/agenda" className="schedule-row" key={item.time} aria-label={`${item.day}, ${item.time}, ${item.title}. Ver agenda completa`}>
            <CalendarDays aria-hidden="true" /><span>{item.short}</span><time>{item.time}</time><span>{item.title}</span><ChevronRight aria-hidden="true" />
          </a>)}
        </div>
        <a className="inline-link" href="/agenda">Agenda completa e como chegar <ChevronRight aria-hidden="true" /></a>
      </div>
      <a className="literature-feature literature-panel" href="/blog">
        <img src="/images/site/blog/tessalonicenses-evento-480.webp" alt="Arte da Escola Bíblica de Tessalonicenses" width="480" height="854" loading="lazy" decoding="async" />
        <span><BookOpenText aria-hidden="true" /><strong>Literatura em destaque aplicada</strong><small>Leitura bíblica, contexto e aplicação para a vida da igreja.</small><span className="literature-action">Acompanhar o estudo <ChevronRight aria-hidden="true" /></span></span>
      </a>
    </div>
  </section>;
}
