import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../config/supabase";
import { DEFAULT_FEATURED_STUDY } from "../data/featuredStudy";
import {
  DEFAULT_SITE_SETTINGS,
  FONT_OPTIONS,
  THEME_COLOR_FIELDS,
  type SiteTheme,
  applyTheme,
  normalizeSiteSettings,
} from "../data/siteSettings";
import "../styles/panel.css";

interface FormState {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  art480: string;
  art900: string;
  artAlt: string;
  bookTitle: string;
  bookAuthor: string;
  bookHref: string;
  bookLinkLabel: string;
  sourcesText: string;
}

interface Revision {
  id: number;
  action: string;
  note: string;
  created_at: string;
  created_by: string;
}

type Tab = "destaque" | "aparencia" | "historico";

const EMPTY: FormState = {
  slug: "", title: "", subtitle: "", intro: "", art480: "", art900: "", artAlt: "",
  bookTitle: "", bookAuthor: "", bookHref: "", bookLinkLabel: "", sourcesText: "",
};

const slugify = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const sourcesToText = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (!item || typeof item !== "object") return "";
    const source = item as Record<string, unknown>;
    const label = String(source.label ?? "").trim();
    const href = String(source.href ?? "").trim();
    return label && href ? `${label} | ${href}` : "";
  }).filter(Boolean).join("\n");
};

const textToSources = (value: string) =>
  value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [label, ...rest] = line.split("|");
    return { label: label.trim(), href: rest.join("|").trim() };
  }).filter((source) => source.label && /^https:\/\//.test(source.href));

function formFromRow(row: Record<string, unknown> | null): FormState {
  if (!row) {
    return { ...EMPTY, slug: DEFAULT_FEATURED_STUDY.slug, title: DEFAULT_FEATURED_STUDY.title,
      subtitle: DEFAULT_FEATURED_STUDY.subtitle, intro: DEFAULT_FEATURED_STUDY.intro,
      artAlt: DEFAULT_FEATURED_STUDY.artAlt };
  }
  return {
    slug: String(row.slug ?? ""), title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""), intro: String(row.intro ?? ""),
    art480: String(row.art_480_url ?? ""), art900: String(row.art_900_url ?? ""),
    artAlt: String(row.art_alt ?? ""), bookTitle: String(row.book_title ?? ""),
    bookAuthor: String(row.book_author ?? ""), bookHref: String(row.book_href ?? ""),
    bookLinkLabel: String(row.book_link_label ?? ""), sourcesText: sourcesToText(row.sources),
  };
}

function payloadFromForm(form: FormState) {
  return {
    slug: form.slug.trim(), title: form.title.trim(), subtitle: form.subtitle.trim(),
    intro: form.intro.trim(), art_480_url: form.art480.trim(), art_900_url: form.art900.trim(),
    art_alt: form.artAlt.trim(), book_title: form.bookTitle.trim(),
    book_author: form.bookAuthor.trim(), book_href: form.bookHref.trim(),
    book_link_label: form.bookLinkLabel.trim(), sources: textToSources(form.sourcesText),
    is_active: true,
  };
}

export default function Panel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("destaque");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_SITE_SETTINGS.theme);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [publishNote, setPublishNote] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const client = supabase;

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!client) { setChecking(false); return; }
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setChecking(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [client]);

  const loadActive = useCallback(async () => {
    if (!client) return;
    const { data, error: loadError } = await client
      .from("featured_studies").select("*").eq("is_active", true).maybeSingle();
    if (loadError) { setError(`Não foi possível ler o destaque: ${loadError.message}`); return; }
    setForm(formFromRow(data as Record<string, unknown> | null));
  }, [client]);

  const loadSettings = useCallback(async () => {
    if (!client) return;
    const { data, error: loadError } = await client
      .from("site_settings").select("draft,published").eq("id", true).maybeSingle();
    if (loadError) { setError(`Não foi possível ler a aparência: ${loadError.message}`); return; }
    const row = data as { draft?: unknown; published?: unknown } | null;
    const normalized = normalizeSiteSettings(row?.draft ?? row?.published);
    setTheme(normalized.theme);
    applyTheme(normalized.theme);
  }, [client]);

  const loadHistory = useCallback(async () => {
    if (!client) return;
    const { data, error: loadError } = await client
      .from("content_revisions")
      .select("id,action,note,created_at,created_by")
      .eq("entity", "site_settings")
      .order("created_at", { ascending: false })
      .limit(25);
    if (loadError) { setError(`Não foi possível ler o histórico: ${loadError.message}`); return; }
    setRevisions((data ?? []) as Revision[]);
  }, [client]);

  useEffect(() => {
    if (!session) return;
    void loadActive();
    void loadSettings();
    void loadHistory();
  }, [session, loadActive, loadSettings, loadHistory]);

  const set = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setThemeField = (key: keyof SiteTheme, value: string) =>
    setTheme((current) => {
      const next = { ...current, [key]: value };
      applyTheme(next);
      return next;
    });

  const uploadArt = async (file: File, variant: "480" | "900") => {
    if (!client) return;
    const slug = form.slug.trim() || "estudo";
    const extension = (file.name.split(".").pop() ?? "webp").toLowerCase();
    const path = `${slug}-${variant}-${Date.now()}.${extension}`;
    setBusy(true); setError("");
    try {
      const { error: uploadError } = await client.storage
        .from("estudos-artes").upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = client.storage.from("estudos-artes").getPublicUrl(path);
      set(variant === "480" ? "art480" : "art900", data.publicUrl);
      setStatus(`Arte ${variant} enviada.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio da arte.");
    } finally { setBusy(false); }
  };

  const saveStudy = async () => {
    if (!client || !session) return;
    const payload = payloadFromForm(form);
    if (payload.slug.length < 3 || !payload.title) { setError("Preencha ao menos o slug e o título."); return; }
    setBusy(true); setError(""); setStatus("");
    try {
      const { error: clearError } = await client.from("featured_studies").update({ is_active: false }).eq("is_active", true);
      if (clearError) throw new Error(clearError.message);
      const { error: upsertError } = await client.from("featured_studies")
        .upsert({ ...payload, updated_by: session.user.email ?? "" }, { onConflict: "slug" });
      if (upsertError) throw new Error(upsertError.message);
      setStatus("Destaque publicado.");
      await loadActive();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao publicar.");
    } finally { setBusy(false); }
  };

  const saveDraft = async () => {
    if (!client || !session) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const { error: draftError } = await client.from("site_settings")
        .update({ draft: { theme }, updated_by: session.user.email ?? "" }).eq("id", true);
      if (draftError) throw new Error(draftError.message);
      setStatus("Rascunho salvo. Nada foi publicado ainda.");
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : "Falha ao salvar o rascunho.");
    } finally { setBusy(false); }
  };

  const publishTheme = async () => {
    if (!client) return;
    setBusy(true); setError(""); setStatus("");
    try {
      await saveDraft();
      const { error: publishError } = await client.rpc("publish_site_settings", { p_note: publishNote });
      if (publishError) throw new Error(publishError.message);
      setStatus("Aparência publicada no site.");
      setPublishNote("");
      await loadHistory();
    } catch (publishErr) {
      setError(publishErr instanceof Error ? publishErr.message : "Falha ao publicar.");
    } finally { setBusy(false); }
  };

  const rollback = async (id: number) => {
    if (!client) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const { error: rollbackError } = await client.rpc("rollback_site_settings", { p_revision: id });
      if (rollbackError) throw new Error(rollbackError.message);
      setStatus(`Revisão ${id} restaurada.`);
      await loadSettings();
      await loadHistory();
    } catch (rollbackErr) {
      setError(rollbackErr instanceof Error ? rollbackErr.message : "Falha ao restaurar.");
    } finally { setBusy(false); }
  };

  const signIn = async () => {
    if (!client) return;
    setBusy(true); setError("");
    const { error: authError } = await client.auth.signInWithPassword({
      email: loginEmail.trim(), password: loginPassword,
    });
    if (authError) setError(authError.message);
    setBusy(false);
  };

  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    setStatus("Sessão encerrada.");
  };

  const preview = useMemo(() => form.art480 || form.art900, [form.art480, form.art900]);

  if (!client) {
    return <main className="panel-page"><div className="panel-card">
      <h1>Painel indisponível</h1>
      <p>Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no ambiente.</p>
    </div></main>;
  }

  if (checking) {
    return <main className="panel-page"><div className="panel-card" role="status">Verificando a sessão…</div></main>;
  }

  if (!session) {
    return <main className="panel-page">
      <form className="panel-card" onSubmit={(event) => { event.preventDefault(); void signIn(); }}>
        <h1>Painel da Reconciliação</h1>
        <p className="panel-hint">Entre com a conta da igreja para editar o site.</p>
        <label>E-mail<input type="email" autoComplete="username" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></label>
        {error && <p className="panel-error" role="alert">{error}</p>}
        <button className="panel-button" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>;
  }

  return <main className="panel-page">
    <div className="panel-card panel-wide">
      <header className="panel-head">
        <div>
          <h1>Painel</h1>
          <p className="panel-hint">{session.user.email}</p>
        </div>
        <button className="panel-link" type="button" onClick={() => void signOut()}>Sair</button>
      </header>

      <nav className="panel-tabs" aria-label="Seções do painel">
        {(["destaque", "aparencia", "historico"] as Tab[]).map((item) => (
          <button key={item} type="button" className="panel-tab" data-active={tab === item}
            onClick={() => { setTab(item); if (item === "historico") void loadHistory(); }}>
            {item === "destaque" ? "Estudo da vez" : item === "aparencia" ? "Aparência" : "Histórico"}
          </button>
        ))}
      </nav>

      {status && <p className="panel-status" role="status">{status}</p>}
      {error && <p className="panel-error" role="alert">{error}</p>}

      {tab === "destaque" && <>
        <div className="panel-grid">
          <label>Identificador (slug)<input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></label>
          <label>Título<input value={form.title} onChange={(e) => set("title", e.target.value)} /></label>
          <label>Subtítulo<input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></label>
          <label className="panel-full">Descrição geral<textarea rows={4} value={form.intro} onChange={(e) => set("intro", e.target.value)} /></label>
          <label className="panel-full">Texto alternativo da arte<input value={form.artAlt} onChange={(e) => set("artAlt", e.target.value)} /></label>
          <div className="panel-full panel-art">
            <div className="panel-art-preview">{preview ? <img src={preview} alt="Prévia da arte" /> : <span>Sem arte enviada</span>}</div>
            <div className="panel-art-fields">
              <label>Arte 480 (menor)<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadArt(f, "480"); }} /></label>
              <label>Arte 900 (maior)<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadArt(f, "900"); }} /></label>
              <p className="panel-hint">WebP, JPG ou PNG, até 5 MB. O envio é imediato.</p>
            </div>
          </div>
          <label>Livro — título<input value={form.bookTitle} onChange={(e) => set("bookTitle", e.target.value)} /></label>
          <label>Livro — autor/editora<input value={form.bookAuthor} onChange={(e) => set("bookAuthor", e.target.value)} /></label>
          <label>Livro — link (https)<input value={form.bookHref} onChange={(e) => set("bookHref", e.target.value)} /></label>
          <label>Livro — texto do botão<input value={form.bookLinkLabel} onChange={(e) => set("bookLinkLabel", e.target.value)} /></label>
          <label className="panel-full">Links de apoio (um por linha, <code>Rótulo | https://…</code>)<textarea rows={3} value={form.sourcesText} onChange={(e) => set("sourcesText", e.target.value)} /></label>
        </div>
        <div className="panel-actions">
          <button className="panel-button" type="button" onClick={() => void saveStudy()} disabled={busy}>{busy ? "Salvando…" : "Publicar destaque"}</button>
          <button className="panel-link" type="button" onClick={() => void loadActive()} disabled={busy}>Descartar</button>
        </div>
      </>}

      {tab === "aparencia" && <>
        <div className="panel-preview" aria-label="Prévia da aparência">
          <span style={{ color: "var(--gold)", fontFamily: "var(--condensed)" }}>Escola Bíblica · Prévia</span>
          <h2 style={{ color: "var(--paper)", fontFamily: "var(--display)" }}>{form.title || "Tessalonicenses"}</h2>
          <p style={{ color: "var(--muted)", fontFamily: "var(--body)" }}>{form.subtitle || "Visão de uma igreja local"}</p>
          <span className="panel-preview-button" style={{ background: "var(--gold)", color: "var(--ink)", fontFamily: "var(--condensed)" }}>Botão de exemplo</span>
        </div>
        <div className="panel-grid">
          <label>Fonte de título<select value={theme.displayFont} onChange={(e) => setThemeField("displayFont", e.target.value)}>{FONT_OPTIONS.display.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label>Fonte condensada<select value={theme.condensedFont} onChange={(e) => setThemeField("condensedFont", e.target.value)}>{FONT_OPTIONS.condensed.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label>Fonte do texto<select value={theme.bodyFont} onChange={(e) => setThemeField("bodyFont", e.target.value)}>{FONT_OPTIONS.body.map((f) => <option key={f}>{f === "system" ? "Padrão do sistema" : f}</option>)}</select></label>
        </div>
        <div className="panel-colors">
          {THEME_COLOR_FIELDS.map((field) => (
            <label key={field.key} className="panel-color">
              <span>{field.label}</span>
              <input type="color" value={theme[field.key]} onChange={(e) => setThemeField(field.key, e.target.value)} />
              <input value={theme[field.key]} onChange={(e) => setThemeField(field.key, e.target.value)} aria-label={`${field.label} (hex)`} />
            </label>
          ))}
        </div>
        <div className="panel-actions">
          <button className="panel-button" type="button" onClick={() => void saveDraft()} disabled={busy}>Salvar rascunho</button>
          <button className="panel-button panel-button-alt" type="button" onClick={() => void publishTheme()} disabled={busy}>Publicar no site</button>
        </div>
        <label className="panel-full">Nota da publicação (opcional)<input value={publishNote} onChange={(e) => setPublishNote(e.target.value)} /></label>
      </>}

      {tab === "historico" && <>
        <p className="panel-hint">Cada publicação guarda uma revisão. Restaurar volta o site para aquele estado.</p>
        <div className="panel-history">
          {revisions.length === 0 && <p className="panel-hint">Nenhuma revisão registrada ainda.</p>}
          {revisions.map((revision) => (
            <div key={revision.id} className="panel-history-row">
              <span>
                <strong>#{revision.id} · {revision.action}</strong>
                <small>{new Date(revision.created_at).toLocaleString("pt-BR")} · {revision.created_by || "—"} {revision.note ? `· ${revision.note}` : ""}</small>
              </span>
              <button className="panel-link" type="button" onClick={() => void rollback(revision.id)} disabled={busy}>Restaurar</button>
            </div>
          ))}
        </div>
        <div className="panel-actions">
          <button className="panel-link" type="button" onClick={() => void loadHistory()} disabled={busy}>Atualizar histórico</button>
        </div>
      </>}
    </div>
  </main>;
}
