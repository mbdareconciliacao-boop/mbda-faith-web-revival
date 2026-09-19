import type { MonthlyItem, ScheduleItem, SiteContent } from "../../data/siteSettings";

interface EditorProps {
  content: SiteContent;
  onChange: (next: SiteContent) => void;
}

export default function AgendaEditor({ content, onChange }: EditorProps) {
  const agenda = content.agenda;
  const patch = (next: Partial<SiteContent["agenda"]>) =>
    onChange({ ...content, agenda: { ...agenda, ...next } });
  const setWeekly = (index: number, key: keyof ScheduleItem, value: string) =>
    patch({ weekly: agenda.weekly.map((item, i) => (i === index ? { ...item, [key]: value } : item)) });
  const setMonthly = (index: number, key: keyof MonthlyItem, value: string) =>
    patch({ monthly: agenda.monthly.map((item, i) => (i === index ? { ...item, [key]: value } : item)) });

  return <>
    <h2 className="panel-section-title">Cabeçalho da agenda</h2>
    <div className="panel-grid">
      <label>Título<input value={agenda.heading} onChange={(e) => patch({ heading: e.target.value })} /></label>
      <label>Citação (rodapé do cartaz)<input value={agenda.posterQuote} onChange={(e) => patch({ posterQuote: e.target.value })} /></label>
      <label>Referência<input value={agenda.posterCite} onChange={(e) => patch({ posterCite: e.target.value })} /></label>
      <label className="panel-full">Descrição<textarea rows={2} value={agenda.lead} onChange={(e) => patch({ lead: e.target.value })} /></label>
    </div>

    <h2 className="panel-section-title">Cultos semanais</h2>
    <div className="panel-list">
      {agenda.weekly.map((item, index) => (
        <div className="panel-item" key={`weekly-${index}`}>
          <div className="panel-item-grid">
            <label>Dia<input value={item.day} onChange={(e) => setWeekly(index, "day", e.target.value)} /></label>
            <label>Abrev.<input value={item.short} onChange={(e) => setWeekly(index, "short", e.target.value)} /></label>
            <label>Hora<input value={item.time} onChange={(e) => setWeekly(index, "time", e.target.value)} /></label>
            <label>Título<input value={item.title} onChange={(e) => setWeekly(index, "title", e.target.value)} /></label>
            <label>Formato<input value={item.format} onChange={(e) => setWeekly(index, "format", e.target.value)} /></label>
          </div>
          <button className="panel-link panel-remove" type="button" onClick={() => patch({ weekly: agenda.weekly.filter((_, i) => i !== index) })}>Remover</button>
        </div>
      ))}
    </div>
    <button className="panel-link" type="button" onClick={() => patch({ weekly: [...agenda.weekly, { day: "Domingo", short: "DOM", time: "", title: "", format: "Presencial" }] })}>+ Adicionar culto</button>

    <h2 className="panel-section-title">Encontros mensais</h2>
    <div className="panel-list">
      {agenda.monthly.map((item, index) => (
        <div className="panel-item" key={`monthly-${index}`}>
          <div className="panel-item-grid">
            <label>Cadência<input value={item.cadence} onChange={(e) => setMonthly(index, "cadence", e.target.value)} /></label>
            <label>Abrev.<input value={item.shortCadence} onChange={(e) => setMonthly(index, "shortCadence", e.target.value)} /></label>
            <label>Título<input value={item.title} onChange={(e) => setMonthly(index, "title", e.target.value)} /></label>
          </div>
          <button className="panel-link panel-remove" type="button" onClick={() => patch({ monthly: agenda.monthly.filter((_, i) => i !== index) })}>Remover</button>
        </div>
      ))}
    </div>
    <button className="panel-link" type="button" onClick={() => patch({ monthly: [...agenda.monthly, { cadence: "", shortCadence: "", title: "" }] })}>+ Adicionar encontro</button>
  </>;
}
