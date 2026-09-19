import { BookOpenText, CalendarDays, ChevronRight } from "lucide-react";
import { WEEKLY_SCHEDULE } from "../../data/church";
import { useFeaturedStudy } from "../../hooks/useFeaturedStudy";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export default function WeeklyPreview() {
  const { content } = useSiteSettings();
  const { study } = useFeaturedStudy();
  return <section className="weekly-preview" aria-labelledby="weekly-preview-title">
    <div className="content-width weekly-grid">
      <div>
        <h2 id="weekly-preview-title">{content.home.weeklyTitle}</h2>
        <span className="gold-rule" aria-hidden="true" />
        <div className="schedule-preview">
          {WEEKLY_SCHEDULE.map(item => <a href="/agenda" className="schedule-row" key={item.time} aria-label={`${item.day}, ${item.time}, ${item.title}. Ver agenda completa`}>
            <CalendarDays aria-hidden="true" /><span>{item.short}</span><time>{item.time}</time><span>{item.title}</span><ChevronRight aria-hidden="true" />
          </a>)}
        </div>
        <a className="inline-link" href="/agenda">Agenda completa e como chegar <ChevronRight aria-hidden="true" /></a>
      </div>
      <a className="literature-feature literature-panel" href="/blog">
        <img src={study.art480} srcSet={`${study.art480} 480w, ${study.art900} 900w`} sizes="(max-width: 960px) 90vw, 480px" alt={study.artAlt} width="480" height="854" loading="lazy" decoding="async" />
        <span><BookOpenText aria-hidden="true" /><strong>{study.title}</strong><small>{study.subtitle || content.home.literatureNote}</small><span className="literature-action">{content.home.literatureAction} <ChevronRight aria-hidden="true" /></span></span>
      </a>
    </div>
  </section>;
}
