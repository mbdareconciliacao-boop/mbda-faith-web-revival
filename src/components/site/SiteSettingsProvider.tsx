import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "../../config/supabase";
import { SiteSettingsContext } from "../../context/siteSettingsContext";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  applyTheme,
  mergeEntityRows,
} from "../../data/siteSettings";

/** Carrega as entidades publicadas e distribui tema + conteúdo. */
export default function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    applyTheme(DEFAULT_SITE_SETTINGS.theme);
    const client = supabase;
    if (!client) return;
    let active = true;
    const load = async () => {
      const { data, error } = await client
        .from("site_entities")
        .select("entity,content")
        .eq("state", "published");
      if (!active || error || !data) return;
      const normalized = mergeEntityRows(data as Array<{ entity: string; content: unknown }>);
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
