import type { SiteContent } from "../../data/siteSettings";

interface EditorProps {
  content: SiteContent;
  onChange: (next: SiteContent) => void;
}

type ParagraphKey = "aboutParagraphs" | "familyParagraphs";
type TitleKey = "aboutTitleLines" | "faithTitleLines" | "familyTitleLines";

export default function ChurchEditor({ content, onChange }: EditorProps) {
  const church = content.church;
  const patch = (next: Partial<SiteContent["church"]>) =>
    onChange({ ...content, church: { ...church, ...next } });
  const setTitle = (key: TitleKey, index: number, value: string) =>
    patch({ [key]: church[key].map((item, i) => (i === index ? value : item)) } as Partial<SiteContent["church"]>);
  const setParagraph = (key: ParagraphKey, index: number, value: string) =>
    patch({ [key]: church[key].map((item, i) => (i === index ? value : item)) } as Partial<SiteContent["church"]>);

  const titleBlock = (label: string, key: TitleKey) => <>
    <h2 className="panel-section-title">{label}</h2>
    <div className="panel-grid">
      {church[key].map((line, index) => (
        <label key={`${key}-${index}`}>Linha {index + 1}<input value={line} onChange={(e) => setTitle(key, index, e.target.value)} /></label>
      ))}
    </div>
  </>;

  const paragraphBlock = (label: string, key: ParagraphKey) => <>
    <h2 className="panel-section-title">{label}</h2>
    <div className="panel-list">
      {church[key].map((paragraph, index) => (
        <div className="panel-full" key={`${key}-${index}`}>
          <label>Parágrafo {index + 1}
            <textarea rows={3} value={paragraph} onChange={(e) => setParagraph(key, index, e.target.value)} />
          </label>
          <button className="panel-link panel-remove" type="button" onClick={() => patch({ [key]: church[key].filter((_, i) => i !== index) } as Partial<SiteContent["church"]>)}>Remover</button>
        </div>
      ))}
    </div>
    <button className="panel-link" type="button" onClick={() => patch({ [key]: [...church[key], ""] } as Partial<SiteContent["church"]>)}>+ Adicionar parágrafo</button>
  </>;

  return <>
    {titleBlock("Quem somos — título", "aboutTitleLines")}
    {paragraphBlock("Quem somos — parágrafos", "aboutParagraphs")}
    <h2 className="panel-section-title">Quem somos — história</h2>
    <label className="panel-full">Nota de história<input value={church.historyNote} onChange={(e) => patch({ historyNote: e.target.value })} /></label>
    {titleBlock("Declaração de fé — título", "faithTitleLines")}
    <label className="panel-full">Declaração de fé — introdução<textarea rows={2} value={church.faithLead} onChange={(e) => patch({ faithLead: e.target.value })} /></label>
    {titleBlock("Espaço Família — título", "familyTitleLines")}
    {paragraphBlock("Espaço Família — parágrafos", "familyParagraphs")}
    <p className="panel-hint">A lista de pontos da declaração de fé (doutrina) continua fixa nesta versão.</p>
  </>;
}
