import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from "lucide-react";
import { BAPTISM_EVENT, EVENT_PHOTOS, eventPhoto, type EventPhoto } from "../../data/church";

export default function EventGallery() {
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(true);
  const [hidden, setHidden] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); if(entry.isIntersecting) setLoaded(true); }, {threshold:.15});
    if (section.current) observer.observe(section.current);
    const visibility = () => setHidden(document.hidden);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPaused(motion.matches);
    visibility();
    const preference = () => { if (motion.matches) setPaused(true); };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", preference);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange",visibility); motion.removeEventListener("change",preference); };
  }, []);
  const running = visible && !paused && !hidden && !hovered && !focused && !failed;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % EVENT_PHOTOS.length), 7000);
    return () => clearInterval(timer);
  }, [running]);
  const change = (step: number) => { setPaused(true); setFailed(false); setIndex(i => (i + step + EVENT_PHOTOS.length) % EVENT_PHOTOS.length); };
  const photo: EventPhoto = EVENT_PHOTOS[index];
  const alt = photo.alt ?? (photo.kind === "pastor"
    ? "Pr. Luiz Carlos Aparício pregando na tribuna durante um evento da Reconciliação"
    : photo.kind === "community"
      ? "Momento de comunhão entre participantes de um evento da Reconciliação"
      : "Casal participante de um evento da Reconciliação");
  const caption = photo.kind === "baptism"
    ? `${BAPTISM_EVENT.title} · ${BAPTISM_EVENT.date}`
    : photo.kind === "pastor"
    ? "Pr. Luiz Carlos Aparício · Ministração na Reconciliação"
    : "Eventos da Reconciliação · Ministério Bíblico da Reconciliação";
  return <section id="comunidade" ref={section} className="section-space community-section" aria-labelledby="community-title">
    <div className="content-width community-layout">
      <div className="community-copy">
        <h2 id="community-title">A vida acontece<br />em comunidade.</h2>
        <span className="gold-rule" aria-hidden="true" />
        <p>Encontros que fortalecem os vínculos, renovam a fé e fazem parte da nossa história.</p>
        <h3>Eventos da Reconciliação</h3>
        <p>Uma seleção de registros reais dos encontros da nossa igreja. Celebrações, comunhão e momentos que fazem parte da nossa história.</p>
        <div className="event-feature-note">
          <time dateTime={BAPTISM_EVENT.dateTime}>{BAPTISM_EVENT.date}</time>
          <strong>{BAPTISM_EVENT.title}</strong>
          <p>{BAPTISM_EVENT.description}</p>
          <a href={BAPTISM_EVENT.youtube} target="_blank" rel="noopener noreferrer" className="inline-link">Assistir à celebração <ExternalLink aria-hidden="true" /></a>
        </div>
        <a href="/agenda" className="inline-link">Confira a agenda semanal <ChevronRight aria-hidden="true" /></a>
        <div className="gallery-controls" onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
          <span className="gallery-position" aria-live={running ? "off" : "polite"}>{String(index+1).padStart(2,"0")} <span>/ {String(EVENT_PHOTOS.length).padStart(2,"0")}</span></span>
          <button className="icon-button" type="button" onClick={() => { setPaused(!paused); setFocused(false); }} aria-label={paused ? "Iniciar apresentação de fotos" : "Pausar apresentação de fotos"}>{paused ? <Play /> : <Pause />}</button>
          <button className="icon-button" type="button" onClick={() => change(-1)} aria-label="Foto anterior"><ChevronLeft /></button>
          <button className="icon-button" type="button" onClick={() => change(1)} aria-label="Próxima foto"><ChevronRight /></button>
        </div>
        <p className="fine-print">As fotos avançam a cada 7 segundos. Você pode pausar a qualquer momento.</p>
      </div>
      <figure className="event-gallery" aria-roledescription="carrossel" aria-label="Fotos de eventos da Reconciliação" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {loaded && !failed ? <img key={photo.id} src={eventPhoto(photo.id,480)} srcSet={`${eventPhoto(photo.id,480)} 480w, ${eventPhoto(photo.id,720)} ${photo.width}w`} sizes="(max-width: 640px) 90vw, 420px" width={photo.width} height={photo.height} alt={alt} decoding="async" onError={() => setFailed(true)} /> : <div className="gallery-placeholder">{failed ? "Não foi possível carregar esta foto. Use as setas para ver outra." : "Registros da nossa comunidade"}</div>}
        <figcaption>{caption}</figcaption>
      </figure>
    </div>
  </section>;
}
