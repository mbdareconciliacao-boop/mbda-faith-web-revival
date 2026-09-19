import { useContext } from "react";

import { SiteSettingsContext } from "../context/siteSettingsContext";
import type { SiteSettings } from "../data/siteSettings";

/** Tema e conteúdo publicados (com fallback estático). */
export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
