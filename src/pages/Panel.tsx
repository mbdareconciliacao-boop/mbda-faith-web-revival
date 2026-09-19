import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../config/supabase";
import { DEFAULT_FEATURED_STUDY } from "../data/featuredStudy";
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

const EMPTY: FormState = {
  slug: "",
  title: "",
  subtitle: "",
  intro: "",
  art480: "",
  art900: "",
  artAlt: "",
  bookTitle: "",
  bookAuthor: "",
  bookHref: "",
  bookLinkLabel: "",
  sourcesText: "",
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const sourcesToText = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const source = item as Record<string, unknown>;
      const label = String(source.label ?? "").trim();
      const href = String(source.href ?? "").trim();
      return label && href ? `${label} | ${href}` : "";
    })
    .filter(Boolean)
    .join("\n");
};

const textToSources = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), href: rest.join("|").trim() };
    })
    .filter((source) => source.label && /^https:\/\//.test(source.href));

function formFromRow(row: Record<string, unknown> | null): FormState {
  if (!row) {
    return {
      ...EMPTY,
      slug: DEFAULT_FEATURED_STUDY.slug,
      title: DEFAULT_FEATURED_STUDY.title,
      subtitle: DEFAULT_FEATURED_STUDY.subtitle,
      intro: DEFAULT_FEATURED_STUDY.intro,
      artAlt: DEFAULT_FEATURED_STUDY.artAlt,
    };
  }
  return {
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    intro: String(row.intro ?? ""),
    art480: String(row.art_480_url ?? ""),
    art900: String(row.art_900_url ?? ""),
    artAlt: String(row.art_alt ?? ""),
    bookTitle: String(row.book_title ?? ""),
    bookAuthor: String(row.book_author ?? ""),
    bookHref: String(row.book_href ?? ""),
    bookLinkLabel: String(row.book_link_label ?? ""),
    sourcesText: sourcesToText(row.sources),
  };
}

function payloadFromForm(form: FormState) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    intro: form.intro.trim(),
    art_480_url: form.art480.trim(),
    art_900_url: form.art900.trim(),
    art_alt: form.artAlt.trim(),
    book_title: form.bookTitle.trim(),
    book_author: form.bookAuthor.trim(),
    book_href: form.bookHref.trim(),
    book_link_label: form.bookLinkLabel.trim(),
    sources: textToSources(form.sourcesText),
    is_active: true,
  };
}

export default function Panel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY);
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
    if (!client) {
      setChecking(false);
      return;
    }
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
      .from("featured_studies")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    if (loadError) {
      setError(`Não foi possível ler o destaque: ${loadError.message}`);
      return;
    }
    setForm(formFromRow(data as Record<string, unknown> | null));
  }, [client]);

  useEffect(() => {
    if (session) void loadActive();
  }, [session, loadActive]);

  const set = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadArt = async (file: File, variant: "480" | "900") => {
    if (!client) return;
    const slug = form.slug.trim() || "estudo";
    const extension = (file.name.split(".").pop() ?? "webp").toLowerCase();
    const path = `${slug}-${variant}-${Date.now()}.${extension}`;
    setBusy(true);
    setError("");
    try {
      const { error: uploadError } = await client.storage
        .from("estudos-artes")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = client.storage.from("estudos-artes").getPublicUrl(path);
      set(variant === "480" ? "art480" : "art900", data.publicUrl);
      setStatus(`Arte ${variant} enviada.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio da arte.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!client || !session) return;
    const payload = payloadFromForm(form);
    if (payload.slug.length < 3 || !payload.title) {
      setError("Preencha ao menos o identificador (slug) e o título.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const { error: clearError } = await client
        .from("featured_studies")
        .update({ is_active: false })
        .eq("is_active", true);
      if (clearError) throw new Error(clearError.message);
      const { error: upsertError } = await client
        .from("featured_studies")
        .upsert({ ...payload, updated_by: session.user.email ?? "" }, { onConflict: "slug" });
      if (upsertError) throw new Error(upsertError.message);
      setStatus("Destaque publicado. O site atualiza na próxima visita.");
      await loadActive();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao publicar.");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    if (!client) return;
    setBusy(true);
    setError("");
    const { error: authError } = await client.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
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
    return (
      <main className="panel-page">
        <div className="panel-card">
          <h1>Painel indisponível</h1>
          <p>
            Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no
            ambiente para habilitar o painel.
          </p>
        </div>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="panel-page">
        <div className="panel-card" role="status">
          Verificando a sessão…
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="panel-page">
        <form
          className="panel-card"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn();
          }}
        >
          <h1>Painel do estudo da vez</h1>
          <p className="panel-hint">Entre com a conta da igreja para editar o destaque do site.</p>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="panel-error" role="alert">{error}</p>}
          <button className="panel-button" type="submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="panel-page">
      <div className="panel-card panel-wide">
        <header className="panel-head">
          <div>
            <h1>Estudo da vez</h1>
            <p className="panel-hint">Logado como {session.user.email}</p>
          </div>
          <button className="panel-link" type="button" onClick={() => void signOut()}>
            Sair
          </button>
        </header>

        {status && <p className="panel-status" role="status">{status}</p>}
        {error && <p className="panel-error" role="alert">{error}</p>}

        <div className="panel-grid">
          <label>
            Identificador (slug)
            <input value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))} />
          </label>
          <label>
            Título
            <input value={form.title} onChange={(event) => set("title", event.target.value)} />
          </label>
          <label>
            Subtítulo
            <input value={form.subtitle} onChange={(event) => set("subtitle", event.target.value)} />
          </label>
          <label className="panel-full">
            Descrição geral
            <textarea
              rows={4}
              value={form.intro}
              onChange={(event) => set("intro", event.target.value)}
            />
          </label>
          <label className="panel-full">
            Texto alternativo da arte
            <input value={form.artAlt} onChange={(event) => set("artAlt", event.target.value)} />
          </label>

          <div className="panel-full panel-art">
            <div className="panel-art-preview">
              {preview ? (
                <img src={preview} alt="Prévia da arte" />
              ) : (
                <span>Sem arte enviada</span>
              )}
            </div>
            <div className="panel-art-fields">
              <label>
                Arte 480 (menor)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadArt(file, "480");
                  }}
                />
              </label>
              <label>
                Arte 900 (maior)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadArt(file, "900");
                  }}
                />
              </label>
              <p className="panel-hint">Envie imagens WebP ou JPG. O envio é imediato.</p>
            </div>
          </div>

          <label>
            Livro — título
            <input value={form.bookTitle} onChange={(event) => set("bookTitle", event.target.value)} />
          </label>
          <label>
            Livro — autor/editora
            <input value={form.bookAuthor} onChange={(event) => set("bookAuthor", event.target.value)} />
          </label>
          <label>
            Livro — link (https)
            <input value={form.bookHref} onChange={(event) => set("bookHref", event.target.value)} />
          </label>
          <label>
            Livro — texto do botão
            <input
              value={form.bookLinkLabel}
              onChange={(event) => set("bookLinkLabel", event.target.value)}
            />
          </label>
          <label className="panel-full">
            Links de apoio (um por linha, no formato <code>Rótulo | https://…</code>)
            <textarea
              rows={3}
              value={form.sourcesText}
              onChange={(event) => set("sourcesText", event.target.value)}
            />
          </label>
        </div>

        <p className="panel-hint">
          O roteiro lição a lição continua sendo o conteúdo atual de Tessalonicenses. A troca de
          livro nesta versão atualiza arte, títulos, descrição geral e livros recomendados.
        </p>

        <div className="panel-actions">
          <button className="panel-button" type="button" onClick={() => void save()} disabled={busy}>
            {busy ? "Salvando…" : "Publicar destaque"}
          </button>
          <button className="panel-link" type="button" onClick={() => void loadActive()} disabled={busy}>
            Recarregar
          </button>
        </div>
      </div>
    </main>
  );
}
