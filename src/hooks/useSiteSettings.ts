import { useEffect, useState } from "react";

import { supabase } from "../config/supabase";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  applyTheme,
  normalizeSiteSettings,
} from "../data/siteSettings";

/**
 * Lê o tema publicado do Supabase e aplica as variáveis CSS no documento.
 * Antes de responder, já aplica o padrão (SSR/prerender e uso offline).
 */
export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    applyTheme(DEFAULT_SITE_SETTINGS.theme);
    const client = supabase;
    if (!client) return;
    let active = true;
    const load = async () => {
      const { data, error } = await client
        .from("site_settings")
        .select("published")
        .eq("id", true)
        .maybeSingle();
      if (!active || error || !data) return;
      const normalized = normalizeSiteSettings((data as { published?: unknown }).published);
      setSettings(normalized);
      applyTheme(normalized.theme);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
