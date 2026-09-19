import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "../../config/supabase";
import { SiteSettingsContext } from "../../context/siteSettingsContext";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  applyTheme,
  normalizeSiteSettings,
} from "../../data/siteSettings";

/** Carrega o tema e o conteúdo publicados uma única vez e os distribui. */
export default function SiteSettingsProvider({ children }: { children: ReactNode }) {
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

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}
