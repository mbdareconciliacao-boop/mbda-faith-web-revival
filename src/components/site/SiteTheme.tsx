import { useSiteSettings } from "../../hooks/useSiteSettings";

/** Aplica o tema publicado (efeito colateral) sem renderizar nada. */
export default function SiteTheme() {
  useSiteSettings();
  return null;
}
