import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { SITE_ORIGIN } from "../../data/contentCatalog";

export default function ShareLink({ path }: { path: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(SITE_ORIGIN + path); setStatus("copied"); }
    catch { setStatus("manual"); }
  };
  return <div className="share-link">
    <button className="inline-link" type="button" onClick={copy}>{status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}Copiar link</button>
    <span role="status">{status === "copied" && "Link copiado."}{status === "manual" && "Não foi possível copiar. Selecione o endereço abaixo."}</span>
    {status === "manual" && <input aria-label="Link para compartilhar" readOnly value={SITE_ORIGIN + path} onFocus={event => event.target.select()} />}
  </div>;
}
