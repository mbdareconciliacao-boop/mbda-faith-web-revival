import { Search, X } from "lucide-react";

export default function CatalogSearch({ value, onChange, label, count }: {
  value: string; onChange: (value: string) => void; label: string; count: number;
}) {
  return <div className="catalog-search">
    <label htmlFor="catalog-search">{label}</label>
    <div className="catalog-search-input"><Search aria-hidden="true" />
      <input id="catalog-search" type="search" maxLength={120} value={value} onChange={event => onChange(event.target.value)} autoComplete="off" aria-controls="catalog-results" />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Limpar busca"><X aria-hidden="true" /></button>}
    </div>
    <p role="status">{count} {count === 1 ? "resultado" : "resultados"}{value ? ` para “${value}”` : " no acervo"}</p>
  </div>;
}
