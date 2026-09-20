import { useEffect, useRef, useState, type ReactNode } from "react";

import { supabase } from "../../config/supabase";
import { SiteSettingsContext } from "../../context/siteSettingsContext";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  applyTheme,
  mergeEntityRows,
  normalizeSiteSettings,
} from "../../data/siteSettings";

/** Carrega as entidades publicadas e distribui tema + conteúdo. */
export default function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const previewReceived = useRef(false);

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
      if (!active || previewReceived.current || error || !data) return;
      const normalized = mergeEntityRows(data as Array<{ entity: string; content: unknown }>);
      setSettings(normalized);
      applyTheme(normalized.theme);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Dentro de um iframe do painel, aceita a previa em tempo real.
  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const data = event.data as { source?: string; settings?: unknown } | null;
      if (!data || data.source !== "mbdar-panel") return;
      previewReceived.current = true;
      const normalized = normalizeSiteSettings(data.settings);
      setSettings(normalized);
      applyTheme(normalized.theme);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ source: "mbdar-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <SiteSettingsContext.Provider value={settings}>
    <div className="site-background" aria-hidden="true" />
    {children}
  </SiteSettingsContext.Provider>;
}
