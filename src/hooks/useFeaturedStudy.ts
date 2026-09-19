import { useEffect, useState } from "react";

import { supabase } from "../config/supabase";
import {
  DEFAULT_FEATURED_STUDY,
  type FeaturedStudy,
  normalizeFeaturedStudy,
} from "../data/featuredStudy";

export interface FeaturedStudyState {
  study: FeaturedStudy;
  /** true quando o conteúdo veio do Supabase, e não do fallback estático. */
  live: boolean;
}

/**
 * Lê o estudo/livro em destaque do Supabase. Renderiza imediatamente com o
 * fallback estático (importante para SSR/prerender e uso offline) e troca
 * quando a resposta chega. Nunca lança erro para não quebrar a página pública.
 */
export function useFeaturedStudy(): FeaturedStudyState {
  const [study, setStudy] = useState<FeaturedStudy>(DEFAULT_FEATURED_STUDY);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const load = async () => {
      const { data, error } = await client
        .from("featured_studies")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (!active || error || !data) return;
      const normalized = normalizeFeaturedStudy(data);
      if (normalized) {
        setStudy(normalized);
        setLive(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return { study, live };
}
