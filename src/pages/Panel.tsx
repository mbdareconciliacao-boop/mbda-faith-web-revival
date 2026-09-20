import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../config/supabase";
import { DEFAULT_FEATURED_STUDY } from "../data/featuredStudy";
import { imageUploadError } from "../domain/editorialSafety";
import type {
  EditorialEntity,
  EditorialProfile,
  EditorialWorkflow,
} from "../domain/editorial";
import {
  DEFAULT_SITE_SETTINGS,
  FONT_OPTIONS,
  THEME_COLOR_FIELDS,
  type SiteContent,
  type SiteEntity,
  type SiteTheme,
  applyTheme,
  SITE_ENTITIES,
  entityContent,
  mergeEntityRows,
} from "../data/siteSettings";
import AgendaEditor from "../components/panel/AgendaEditor";
import BooksEditor from "../components/panel/BooksEditor";
import ChurchEditor from "../components/panel/ChurchEditor";
import "../styles/panel.css";

interface FormState {
  slug: string; title: string; subtitle: string; intro: string;
  art480: string; art900: string; artAlt: string;
  bookTitle: string; bookAuthor: string; bookHref: string; bookLinkLabel: string;
  sourcesText: string;
}

interface Revision {
  id: number; entity: string; action: string; note: string; created_at: string; created_by: string;
}

type Tab = "destaque" | "aparencia" | "conteudo" | "agenda" | "igreja" | "livros" | "historico";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "destaque", label: "Estudo da vez" },
  { id: "aparencia", label: "Aparência" },
  { id: "conteudo", label: "Textos" },
  { id: "agenda", label: "Agenda" },
  { id: "igreja", label: "Igreja" },
  { id: "livros", label: "Livros" },
  { id: "historico", label: "Histórico" },
];

const WORKFLOW_LABELS: Record<EditorialWorkflow["status"], string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovado",
  published: "Publicado",
};
const ROLE_LABELS: Record<EditorialProfile["role"], string> = {
  contributor: "Colaborador",
  editor: "Editor",
  reviewer: "Revisor",
  admin: "Administrador",
};
const TAB_WORKFLOW: Partial<Record<Tab, EditorialEntity>> = {
  destaque: "destaque", aparencia: "tema", conteudo: "textos",
  agenda: "agenda", igreja: "igreja", livros: "livros",
};
const EDITORIAL_ENTITIES = Object.values(TAB_WORKFLOW) as EditorialEntity[];

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

function payloadFromForm(form: FormState, sections: unknown[]) {
  return {
    slug: form.slug.trim(), title: form.title.trim(), subtitle: form.subtitle.trim(),
    intro: form.intro.trim(), art_480_url: form.art480.trim(), art_900_url: form.art900.trim(),
    art_alt: form.artAlt.trim(), book_title: form.bookTitle.trim(),
    book_author: form.bookAuthor.trim(), book_href: form.bookHref.trim(),
    book_link_label: form.bookLinkLabel.trim(), sources: textToSources(form.sourcesText),
    sections, is_active: true,
  };
}

export default function Panel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorization, setAuthorization] = useState<"checking" | "allowed" | "denied">("checking");
  const [contentReady, setContentReady] = useState<"loading" | "ready" | "error">("loading");
  const [profile, setProfile] = useState<EditorialProfile | null>(null);
  const [workflows, setWorkflows] = useState<Partial<Record<EditorialEntity, EditorialWorkflow>>>({});
  const [studySections, setStudySections] = useState<unknown[]>(DEFAULT_FEATURED_STUDY.sections);
  const [tab, setTab] = useState<Tab>("destaque");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_SITE_SETTINGS.theme);
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_SETTINGS.content);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [publishNote, setPublishNote] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [previewWidth, setPreviewWidth] = useState<"full" | "tablet" | "phone">("full");
  const [showPreview, setShowPreview] = useState(true);
  const [videoIdInput, setVideoIdInput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [aal, setAal] = useState<{ current: string | null; next: string | null }>({ current: null, next: null });
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaQr, setMfaQr] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  const client = supabase;
  const workflowEntity = TAB_WORKFLOW[tab] ?? null;
  const workflow = workflowEntity ? workflows[workflowEntity] : undefined;
  const mayEditEntity = (entity: EditorialEntity) => !!profile
    && ["contributor", "editor", "admin"].includes(profile.role)
    && (profile.role === "admin" || profile.entities.includes(entity));
  const canEditCurrent = !!workflowEntity && !!profile
    && mayEditEntity(workflowEntity)
    && workflow?.status !== "in_review";
  const canReviewCurrent = !!workflowEntity && !!profile
    && ["reviewer", "admin"].includes(profile.role)
    && workflow?.status === "in_review";
  const canPublishCurrent = !!workflowEntity && profile?.role === "admin"
    && workflow?.status === "approved" && workflow.approved_revision === workflow.revision;
  const visibleTabs = useMemo(() => TABS.filter((item) => {
    const entity = TAB_WORKFLOW[item.id];
    return !entity || profile?.role === "admin" || profile?.role === "reviewer" || !!profile?.entities.includes(entity);
  }), [profile]);
  useEffect(() => {
    if (profile && !visibleTabs.some((item) => item.id === tab)) setTab(visibleTabs[0]?.id ?? "historico");
  }, [profile, tab, visibleTabs]);

  const previewRef = useRef<HTMLIFrameElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const sessionUserId = session?.user.id;
  const currentAal = aal.current;
  useEffect(() => {
    if (controlsRef.current) applyTheme(theme, controlsRef.current);
  }, [theme, currentAal, contentReady]);
  const PREVIEW_PATHS: Record<string, string> = { destaque: "/", aparencia: "/", conteudo: "/", agenda: "/agenda", igreja: "/igreja", livros: "/livros" };
  const previewPath = PREVIEW_PATHS[tab] ?? "/";
  const sendPreview = useCallback(() => {
    const frame = previewRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage({ source: "mbdar-panel", settings: { theme, content } }, window.location.origin);
  }, [theme, content]);
  useEffect(() => { sendPreview(); }, [sendPreview, previewPath]);
  useEffect(() => {
    const onPreviewReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== previewRef.current?.contentWindow) return;
      const data = event.data as { source?: string } | null;
      if (data?.source === "mbdar-preview-ready") sendPreview();
    };
    window.addEventListener("message", onPreviewReady);
    return () => window.removeEventListener("message", onPreviewReady);
  }, [sendPreview]);

  const refreshAal = useCallback(async () => {
    if (!client) return;
    const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!data) return;
    setAal({ current: data.currentLevel ?? null, next: data.nextLevel ?? null });
    if (data.currentLevel !== "aal2" && data.nextLevel === "aal2") {
      const { data: factors } = await client.auth.mfa.listFactors();
      const verified = factors?.totp?.find((factor) => factor.status === "verified");
      if (verified) setMfaFactorId(verified.id);
    }
  }, [client]);

  const startEnroll = async () => {
    if (!client) return;
    setMfaLoading(true); setError("");
    try {
      const { data, error: enrollError } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Painel MBdaR" });
      if (enrollError) throw new Error(enrollError.message);
      setMfaFactorId(data.id);
      setMfaQr(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
    } catch (enrollErr) {
      setError(enrollErr instanceof Error ? enrollErr.message : "Falha ao ativar o MFA.");
    } finally { setMfaLoading(false); }
  };

  const verifyMfa = async () => {
    if (!client || !mfaFactorId) return;
    setMfaLoading(true); setError("");
    try {
      const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw new Error(challengeError.message);
      const { error: verifyError } = await client.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challenge.id, code: mfaCode });
      if (verifyError) throw new Error(verifyError.message);
      setMfaCode("");
      setMfaQr(""); setMfaSecret("");
      await refreshAal();
    } catch (verifyErr) {
      setError(verifyErr instanceof Error ? verifyErr.message : "Código inválido.");
    } finally { setMfaLoading(false); }
  };

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots"; meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!client) { setChecking(false); return; }
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null); setChecking(false);
      void refreshAal();
    });
    // Do not await Supabase auth calls inside its auth-state lock.
    const { data } = client.auth.onAuthStateChange((_event, next) => { setSession(next); });
    return () => data.subscription.unsubscribe();
  }, [client, refreshAal]);

  useEffect(() => {
    if (session) void refreshAal();
    else setAal({ current: null, next: null });
  }, [session, refreshAal]);

  useEffect(() => {
    setAuthorization("checking");
    setContentReady("loading");
    setProfile(null);
    if (!client || !sessionUserId || currentAal !== "aal2") return;
    let active = true;
    void client.rpc("get_editorial_profile").then(({ data, error: accessError }) => {
      const candidate = data as EditorialProfile | null;
      const allowed = !accessError && !!candidate
        && ["contributor", "editor", "reviewer", "admin"].includes(candidate.role)
        && Array.isArray(candidate.entities);
      if (!active) return;
      setProfile(allowed ? candidate : null);
      setAuthorization(allowed ? "allowed" : "denied");
    });
    return () => { active = false; };
  }, [client, sessionUserId, currentAal]);

  const loadActive = useCallback(async () => {
    if (!client) return;
    const { data, error: loadError } = await client
      .from("featured_studies").select("*").eq("is_active", true).maybeSingle();
    if (loadError) { setError(`Não foi possível ler o destaque: ${loadError.message}`); return false; }
    setForm(formFromRow(data as Record<string, unknown> | null));
    const sections = (data as Record<string, unknown> | null)?.sections;
    setStudySections(Array.isArray(sections) ? sections : DEFAULT_FEATURED_STUDY.sections);
    return true;
  }, [client]);

  const loadSettings = useCallback(async () => {
    if (!client) return;
    const { data, error: loadError } = await client
      .from("site_entities").select("entity,state,content");
    if (loadError) { setError(`Não foi possível ler o conteúdo: ${loadError.message}`); return false; }
    const rows = (data ?? []) as Array<{ entity: string; state: string; content: unknown }>;
    const chosen = new Map<string, unknown>();
    for (const row of rows) if (row.state === "published") chosen.set(row.entity, row.content);
    for (const row of rows) if (row.state === "draft") chosen.set(row.entity, row.content);
    const normalized = mergeEntityRows([...chosen].map(([entity, content]) => ({ entity, content })));
    setTheme(normalized.theme); setContent(normalized.content);
    setVideoIdInput(normalized.content.featuredVideo?.youtubeId ?? "");
    return true;
  }, [client]);

  const loadHistory = useCallback(async () => {
    if (!client) return;
    const { data, error: loadError } = await client
      .from("content_revisions").select("id,entity,action,note,created_at,created_by")
      .order("created_at", { ascending: false }).limit(30);
    if (loadError) { setError(`Não foi possível ler o histórico: ${loadError.message}`); return; }
    setRevisions((data ?? []) as Revision[]);
  }, [client]);

  const loadWorkflows = useCallback(async () => {
    if (!client) return false;
    const { data, error: loadError } = await client.from("editorial_workflow").select("*");
    if (loadError) { setError(`Não foi possível ler a fila editorial: ${loadError.message}`); return false; }
    const rows = (data ?? []) as EditorialWorkflow[];
    const next: Partial<Record<EditorialEntity, EditorialWorkflow>> = {};
    for (const row of rows) next[row.entity] = row;
    setWorkflows(next);

    const siteRows = rows.filter((row) => SITE_ENTITIES.includes(row.entity as SiteEntity));
    if (siteRows.length) {
      const normalized = mergeEntityRows(siteRows.map((row) => ({ entity: row.entity, content: row.payload })));
      setTheme(normalized.theme); setContent(normalized.content);
      setVideoIdInput(normalized.content.featuredVideo?.youtubeId ?? "");
    }
    const featured = next.destaque?.payload;
    if (featured) {
      setForm(formFromRow(featured));
      setStudySections(Array.isArray(featured.sections) ? featured.sections : DEFAULT_FEATURED_STUDY.sections);
    }
    return true;
  }, [client]);

  useEffect(() => {
    if (!sessionUserId || currentAal !== "aal2" || authorization !== "allowed") return;
    let active = true;
    void Promise.all([loadActive(), loadSettings()]).then(async (results) => {
      const workflowReady = await loadWorkflows();
      if (active) setContentReady(results.every(Boolean) && workflowReady ? "ready" : "error");
    }).catch(() => { if (active) setContentReady("error"); });
    void loadHistory();
    return () => { active = false; };
  }, [sessionUserId, currentAal, authorization, loadActive, loadSettings, loadWorkflows, loadHistory]);

  const set = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setThemeField = (key: keyof SiteTheme, value: string) =>
    setTheme((current) => ({ ...current, [key]: value }));

  const patchContent = (updater: (current: SiteContent) => SiteContent) => setContent(updater);
  const setHome = (key: keyof SiteContent["home"], value: string) =>
    patchContent((c) => ({ ...c, home: { ...c.home, [key]: value } }));
  const setContact = (key: keyof SiteContent["contact"], value: string) =>
    patchContent((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));
  const setFooterField = (key: "copyright" | "privacy", value: string) =>
    patchContent((c) => ({ ...c, footer: { ...c.footer, [key]: value } }));
  const setBrand = (key: keyof SiteContent["brand"], value: string) =>
    patchContent((c) => ({ ...c, brand: { ...c.brand, [key]: value } }));
  const setList = (group: "heroLines" | "communityTitleLines", index: number, value: string) =>
    patchContent((c) => ({ ...c, home: { ...c.home, [group]: c.home[group].map((item, i) => i === index ? value : item) } }));
  const setAboutLine = (index: number, value: string) =>
    patchContent((c) => ({ ...c, footer: { ...c.footer, aboutLines: c.footer.aboutLines.map((item, i) => i === index ? value : item) } }));
  const setPath = (index: number, key: "kicker" | "label" | "href", value: string) =>
    patchContent((c) => ({ ...c, home: { ...c.home, paths: c.home.paths.map((item, i) => i === index ? { ...item, [key]: value } : item) } }));
  const setFeaturedVideoId = (youtubeId: string) => {
    setVideoIdInput(youtubeId);
    if (youtubeId && !/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) return;
    patchContent((c) => ({ ...c, featuredVideo: youtubeId ? { youtubeId, title: c.featuredVideo?.title ?? "", description: c.featuredVideo?.description ?? "", date: c.featuredVideo?.date ?? "" } : null }));
  };
  const setFeaturedVideoField = (key: "title" | "description" | "date", value: string) =>
    patchContent((c) => (c.featuredVideo ? { ...c, featuredVideo: { ...c.featuredVideo, [key]: value } } : c));

  const uploadArt = async (file: File, variant: "480" | "900") => {
    if (!client) return;
    const validationError = imageUploadError(file);
    if (validationError) { setError(validationError); return; }
    const slug = form.slug.trim() || "estudo";
    const extension = (file.name.split(".").pop() ?? "webp").toLowerCase();
    const path = `${slug}-${variant}-${Date.now()}.${extension}`;
    setBusy(true); setError("");
    try {
      const { error: uploadError } = await client.storage.from("estudos-artes")
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = client.storage.from("estudos-artes").getPublicUrl(path);
      set(variant === "480" ? "art480" : "art900", data.publicUrl);
      setStatus(`Arte ${variant} enviada.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio da arte.");
    } finally { setBusy(false); }
  };

  const uploadLogo = async (file: File) => {
    if (!client) return;
    const validationError = imageUploadError(file);
    if (validationError) { setError(validationError); return; }
    const extension = (file.name.split(".").pop() ?? "webp").toLowerCase();
    const path = `logo-${Date.now()}.${extension}`;
    setBusy(true); setError("");
    try {
      const { error: uploadError } = await client.storage.from("site-media")
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = client.storage.from("site-media").getPublicUrl(path);
      setBrand("logo", data.publicUrl);
      setStatus("Logo enviado. Salve o rascunho e publique a aba Textos para aplicar.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio do logo.");
    } finally { setBusy(false); }
  };

  const uploadBackground = async (file: File) => {
    if (!client) return;
    const validationError = imageUploadError(file);
    if (validationError) { setError(validationError); return; }
    const extension = (file.name.split(".").pop() ?? "webp").toLowerCase();
    const path = `fundo-${Date.now()}.${extension}`;
    setBusy(true); setError("");
    try {
      const { error: uploadError } = await client.storage.from("site-media")
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = client.storage.from("site-media").getPublicUrl(path);
      setThemeField("backgroundImage", data.publicUrl);
      setStatus("Imagem de fundo enviada. Salve e publique a aba Aparência para aplicar.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio da imagem.");
    } finally { setBusy(false); }
  };

  const updateWorkflow = (row: EditorialWorkflow) => {
    setWorkflows((current) => ({ ...current, [row.entity]: row }));
  };

  const saveEditorialDraft = async (): Promise<EditorialWorkflow | null> => {
    if (!client || !session || !workflowEntity) return null;
    if (!canEditCurrent) { setError("Seu papel não permite editar esta seção agora."); return null; }
    if (workflowEntity === "textos" && videoIdInput && !/^[A-Za-z0-9_-]{11}$/.test(videoIdInput)) {
      setError("O identificador do YouTube deve ter 11 caracteres. Deixe vazio para usar o vídeo mais recente do canal.");
      return null;
    }
    const payload = workflowEntity === "destaque"
      ? payloadFromForm(form, studySections)
      : entityContent(workflowEntity as SiteEntity, { theme, content });
    if (workflowEntity === "destaque" && (String(payload.slug).length < 3 || !payload.title)) {
      setError("Preencha ao menos o slug e o título."); return null;
    }
    const { data, error: draftError } = await client.rpc("save_editorial_draft", {
      p_entity: workflowEntity, p_payload: payload,
    });
    if (draftError) { setError(draftError.message); return null; }
    const row = data as EditorialWorkflow;
    updateWorkflow(row);
    return row;
  };

  const saveDraft = async () => {
    setBusy(true); setError(""); setStatus("");
    try {
      if (await saveEditorialDraft()) setStatus("Rascunho salvo. Nada foi publicado no site.");
    } finally { setBusy(false); }
  };

  const submitReview = async () => {
    if (!client || !workflowEntity) return;
    setBusy(true); setError(""); setStatus("");
    try {
      if (!(await saveEditorialDraft())) return;
      const { data, error: actionError } = await client.rpc("submit_editorial", { p_entity: workflowEntity });
      if (actionError) throw new Error(actionError.message);
      updateWorkflow(data as EditorialWorkflow);
      setStatus("Conteúdo enviado para revisão. A edição fica bloqueada até a decisão.");
      await loadHistory();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao enviar para revisão.");
    } finally { setBusy(false); }
  };

  const requestChanges = async () => {
    if (!client || !workflowEntity) return;
    if (publishNote.trim().length < 3) { setError("Explique o ajuste necessário antes de devolver à equipe."); return; }
    setBusy(true); setError(""); setStatus("");
    try {
      const { data, error: actionError } = await client.rpc("request_editorial_changes", {
        p_entity: workflowEntity, p_note: publishNote,
      });
      if (actionError) throw new Error(actionError.message);
      updateWorkflow(data as EditorialWorkflow); setPublishNote("");
      setStatus("Ajustes solicitados. O conteúdo voltou para a equipe responsável.");
      await loadHistory();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao solicitar ajustes.");
    } finally { setBusy(false); }
  };

  const approve = async () => {
    if (!client || !workflowEntity) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const { data, error: actionError } = await client.rpc("approve_editorial", { p_entity: workflowEntity });
      if (actionError) throw new Error(actionError.message);
      updateWorkflow(data as EditorialWorkflow);
      setStatus("Revisão aprovada. Um administrador já pode publicar.");
      await loadHistory();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao aprovar.");
    } finally { setBusy(false); }
  };

  const publish = async (when: string | null) => {
    if (!client || !workflowEntity) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const result = workflowEntity === "destaque"
        ? await client.rpc("publish_featured_study")
        : await client.rpc("publish_entity", { p_entity: workflowEntity, p_note: publishNote, p_publish_at: when });
      const publishError = result.error;
      if (publishError) throw new Error(publishError.message);
      setStatus(when ? "Publicação agendada." : "Conteúdo aprovado e publicado no site.");
      setPublishNote(""); setScheduleAt("");
      await Promise.all([loadActive(), loadSettings(), loadWorkflows(), loadHistory()]);
    } catch (publishErr) {
      setError(publishErr instanceof Error ? publishErr.message : "Falha ao publicar.");
    } finally { setBusy(false); }
  };

  const rollback = async (id: number) => {
    if (!client || !session) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const { data, error: restoreError } = await client.rpc("restore_editorial_revision", { p_revision: id });
      if (restoreError) throw new Error(restoreError.message);
      updateWorkflow(data as EditorialWorkflow);
      setStatus(`Revisão ${id} recuperada como novo rascunho. O site publicado não mudou.`);
      await Promise.all([loadActive(), loadSettings(), loadWorkflows(), loadHistory()]);
    } catch (rollbackErr) {
      setError(rollbackErr instanceof Error ? rollbackErr.message : "Falha ao restaurar.");
    } finally { setBusy(false); }
  };

  const signIn = async () => {
    if (!client) return;
    setBusy(true); setError("");
    const { error: authError } = await client.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    if (authError) setError(authError.message);
    else setLoginPassword("");
    setBusy(false);
  };
  const signOut = async () => {
    if (!client) return;
    setBusy(true);
    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    const { data: sessionCheck } = await client.auth.getSession();
    setBusy(false);
    if (sessionCheck.session) {
      setError(signOutError ? "Não foi possível encerrar a sessão neste navegador. Tente novamente." : "A sessão ainda está ativa. Tente novamente.");
      return;
    }
    setSession(null);
    setMfaQr(""); setMfaSecret(""); setMfaFactorId(null); setMfaCode("");
    setLoginPassword(""); setStatus(""); setError("");
  };

  const preview = useMemo(() => form.art480 || form.art900, [form.art480, form.art900]);

  if (!client) {
    return <main className="panel-page"><div className="panel-card"><h1>Painel indisponível</h1>
      <p>Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.</p></div></main>;
  }
  if (checking) {
    return <main className="panel-page"><div className="panel-card" role="status">Verificando a sessão…</div></main>;
  }
  if (!session) {
    return <main className="panel-page">
      <form className="panel-card" onSubmit={(event) => { event.preventDefault(); void signIn(); }}>
        <h1>Painel da Reconciliação</h1>
        <p className="panel-hint">Entre com a conta da igreja.</p>
        <label>E-mail<input type="email" autoComplete="username" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></label>
        {error && <p className="panel-error" role="alert">{error}</p>}
        <button className="panel-button" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>;
  }

  if (session && aal.current !== "aal2") {
    const qrSource = mfaQr
      ? (mfaQr.startsWith("data:") ? mfaQr : `data:image/svg+xml;utf8,${encodeURIComponent(mfaQr)}`)
      : "";
    return <main className="panel-page">
      <div className="panel-card">
        <h1>Segurança da conta</h1>
        <p className="panel-hint">Confirme a verificação em duas etapas para editar o site.</p>
        {error && <p className="panel-error" role="alert">{error}</p>}
        {aal.next === "aal2" ? <>
          <label>Código do autenticador<input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} /></label>
          <button className="panel-button" type="button" disabled={mfaLoading || mfaCode.length < 6} onClick={() => void verifyMfa()}>{mfaLoading ? "Confirmando…" : "Confirmar código"}</button>
        </> : qrSource ? <>
          <p className="panel-hint">Escaneie o código no autenticador (Google Authenticator, Authy) e confirme os 6 dígitos.</p>
          <img className="panel-qr" src={qrSource} alt="Código QR para o autenticador" width="200" height="200" />
          <p className="panel-hint">Ou use a chave: <code>{mfaSecret}</code></p>
          <label>Código do autenticador<input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} /></label>
          <button className="panel-button" type="button" disabled={mfaLoading || mfaCode.length < 6} onClick={() => void verifyMfa()}>{mfaLoading ? "Confirmando…" : "Confirmar código"}</button>
        </> : <>
          <p className="panel-hint">Ative o autenticador para liberar a edição.</p>
          <button className="panel-button" type="button" disabled={mfaLoading} onClick={() => void startEnroll()}>{mfaLoading ? "Preparando…" : "Ativar verificação em duas etapas"}</button>
        </>}
        <button className="panel-link" type="button" onClick={() => void refreshAal()}>Já confirmei</button>
        <button className="panel-link" type="button" onClick={() => void signOut()}>Sair</button>
      </div>
    </main>;
  }

  if (authorization !== "allowed" || contentReady !== "ready") {
    const failed = authorization === "denied" || contentReady === "error";
    return <main className="panel-page"><div className="panel-card">
      <h1>{authorization === "denied" ? "Acesso não liberado" : "Preparando o painel"}</h1>
      <p role={failed ? "alert" : "status"}>{authorization === "denied"
        ? "Sua conta não foi autorizada ou a verificação falhou. Entre com a conta cadastrada pela igreja."
        : contentReady === "error" ? "Não foi possível carregar o conteúdo. A edição foi bloqueada para proteger os dados existentes."
        : "Verificando a autorização e carregando o conteúdo…"}</p>
      {error && <p className="panel-error">{error}</p>}
      {failed && <button className="panel-button" type="button" onClick={() => window.location.reload()}>Tentar novamente</button>}
      <button className="panel-link" type="button" onClick={() => void signOut()}>Sair</button>
    </div></main>;
  }

  return <main className="panel-page">
    <div className="panel-shell">
      <header className="panel-head">
        <div><h1>Painel editorial</h1><p className="panel-hint">{profile?.display_name || session.user.email} · {profile ? ROLE_LABELS[profile.role] : ""}</p></div>
        <div className="panel-actions">
          <button className="panel-link" type="button" aria-expanded={showPreview} aria-controls="panel-live-preview" onClick={() => setShowPreview(!showPreview)}>{showPreview ? "Ocultar prévia" : "Mostrar prévia"}</button>
          <a className="panel-link" href="/" target="_blank" rel="noopener noreferrer">Ver site publicado</a>
          <button className="panel-link" type="button" onClick={() => void signOut()}>Sair</button>
        </div>
      </header>

      <nav className="panel-tabs" aria-label="Seções do painel">
        {visibleTabs.map((item) => (
          <button key={item.id} type="button" className="panel-tab" data-active={tab === item.id} aria-pressed={tab === item.id}
            onClick={() => { setTab(item.id); if (item.id === "historico") void loadHistory(); }}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="panel-body" data-preview={showPreview}>
        <div ref={controlsRef} className="panel-controls">
      <p className="panel-hint">{tab === "historico" ? "Consulte as versões antes de recuperar um conteúdo como novo rascunho." : "Edite, salve e envie para revisão. Somente uma revisão aprovada pode ser publicada."}</p>

      {status && <p className="panel-status" role="status">{status}</p>}
      {error && <p className="panel-error" role="alert">{error}</p>}

      {tab !== "historico" && <fieldset className="panel-editor-fields" disabled={!canEditCurrent}>
        <legend className="sr-only">Campos de edição</legend>
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
              <p className="panel-hint">WebP, JPG ou PNG, até 5 MB.</p>
            </div>
          </div>
          <label>Livro — título<input value={form.bookTitle} onChange={(e) => set("bookTitle", e.target.value)} /></label>
          <label>Livro — autor/editora<input value={form.bookAuthor} onChange={(e) => set("bookAuthor", e.target.value)} /></label>
          <label>Livro — link (https)<input value={form.bookHref} onChange={(e) => set("bookHref", e.target.value)} /></label>
          <label>Livro — texto do botão<input value={form.bookLinkLabel} onChange={(e) => set("bookLinkLabel", e.target.value)} /></label>
          <label className="panel-full">Links de apoio (um por linha, <code>Rótulo | https://…</code>)<textarea rows={3} value={form.sourcesText} onChange={(e) => set("sourcesText", e.target.value)} /></label>
        </div>
      </>}

      {tab === "aparencia" && <>
        <div className="panel-preview" aria-label="Prévia da aparência">
          <span style={{ color: "var(--gold)", fontFamily: "var(--condensed)" }}>{content.brand.name} · Prévia</span>
          <h2 style={{ color: "var(--paper)", fontFamily: "var(--display)" }}>{content.home.heroLines[0] || "Tessalonicenses"}</h2>
          <p style={{ color: "#c7d1e5", fontFamily: "var(--body)" }}>{content.home.heroSubtitle}</p>
          <span className="panel-preview-button" style={{ background: "var(--gold)", color: "var(--ink)", fontFamily: "var(--condensed)" }}>{content.home.heroButton}</span>
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
        <h2 className="panel-section-title">Imagem de fundo</h2>
        <div className="panel-grid">
          <label>Enviar imagem<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadBackground(f); }} /></label>
          <label>URL da imagem<input value={theme.backgroundImage} onChange={(e) => setThemeField("backgroundImage", e.target.value)} placeholder="https://... ou /images/..." /></label>
        </div>
        <button className="panel-link" type="button" onClick={() => setThemeField("backgroundImage", "")}>Remover imagem de fundo</button>
      </>}

      {tab === "conteudo" && <>
        <h2 className="panel-section-title">Marca</h2>
        <div className="panel-grid">
          <label>Nome da igreja<input value={content.brand.name} onChange={(e) => setBrand("name", e.target.value)} /></label>
          <label>Logo (imagem)<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); }} /></label>
        </div>
        <h2 className="panel-section-title">Home — abertura</h2>
        <div className="panel-grid">
          {content.home.heroLines.map((line, index) => (
            <label key={`hero-${index}`}>Linha {index + 1} do título<input value={line} onChange={(e) => setList("heroLines", index, e.target.value)} /></label>
          ))}
          <label className="panel-full">Subtítulo<textarea rows={2} value={content.home.heroSubtitle} onChange={(e) => setHome("heroSubtitle", e.target.value)} /></label>
          <label>Texto do botão<input value={content.home.heroButton} onChange={(e) => setHome("heroButton", e.target.value)} /></label>
          <label>Assinatura<input value={content.home.signatureTitle} onChange={(e) => setHome("signatureTitle", e.target.value)} /></label>
          <label className="panel-full">Assinatura (linha de apoio)<input value={content.home.signatureNote} onChange={(e) => setHome("signatureNote", e.target.value)} /></label>
        </div>
        <h2 className="panel-section-title">Vídeo em destaque (opcional)</h2>
        <div className="panel-grid">
          <label>YouTube ID<input value={videoIdInput} onChange={(e) => setFeaturedVideoId(e.target.value)} placeholder="ex.: lcmnshpsR3Q" /></label>
          <label>Título<input value={content.featuredVideo?.title ?? ""} onChange={(e) => setFeaturedVideoField("title", e.target.value)} /></label>
          <label>Data<input value={content.featuredVideo?.date ?? ""} onChange={(e) => setFeaturedVideoField("date", e.target.value)} /></label>
          <label className="panel-full">Descrição<textarea rows={2} value={content.featuredVideo?.description ?? ""} onChange={(e) => setFeaturedVideoField("description", e.target.value)} /></label>
        </div>
        <p className="panel-hint">Se preenchido, este vídeo substitui a mensagem mais recente no destaque da home.</p>
        <h2 className="panel-section-title">Atalhos da home</h2>
        <div className="panel-grid">
          {content.home.paths.map((path, index) => <div key={`path-${index}`} className="panel-full panel-path-row">
            <input value={path.kicker} onChange={(e) => setPath(index, "kicker", e.target.value)} aria-label={`Chamada ${index + 1}`} />
            <input value={path.label} onChange={(e) => setPath(index, "label", e.target.value)} aria-label={`Rótulo ${index + 1}`} />
            <input value={path.href} onChange={(e) => setPath(index, "href", e.target.value)} aria-label={`Link ${index + 1}`} />
          </div>)}
        </div>
        <h2 className="panel-section-title">Home — seções</h2>
        <div className="panel-grid">
          <label>Título da semana<input value={content.home.weeklyTitle} onChange={(e) => setHome("weeklyTitle", e.target.value)} /></label>
          <label>Nota da literatura<input value={content.home.literatureNote} onChange={(e) => setHome("literatureNote", e.target.value)} /></label>
          <label>Ação da literatura<input value={content.home.literatureAction} onChange={(e) => setHome("literatureAction", e.target.value)} /></label>
          {content.home.communityTitleLines.map((line, index) => (
            <label key={`community-${index}`}>Comunidade — linha {index + 1}<input value={line} onChange={(e) => setList("communityTitleLines", index, e.target.value)} /></label>
          ))}
          <label className="panel-full">Comunidade (texto)<textarea rows={2} value={content.home.communityLead} onChange={(e) => setHome("communityLead", e.target.value)} /></label>
          <label>Título dos eventos<input value={content.home.eventsTitle} onChange={(e) => setHome("eventsTitle", e.target.value)} /></label>
          <label className="panel-full">Texto dos eventos<textarea rows={2} value={content.home.eventsLead} onChange={(e) => setHome("eventsLead", e.target.value)} /></label>
        </div>
        <h2 className="panel-section-title">Contato</h2>
        <div className="panel-grid">
          <label>Endereço<input value={content.contact.address} onChange={(e) => setContact("address", e.target.value)} /></label>
          <label>Bairro<input value={content.contact.neighborhood} onChange={(e) => setContact("neighborhood", e.target.value)} /></label>
          <label>Cidade/CEP<input value={content.contact.city} onChange={(e) => setContact("city", e.target.value)} /></label>
          <label>Telefone<input value={content.contact.phone} onChange={(e) => setContact("phone", e.target.value)} /></label>
          <label>WhatsApp (link)<input value={content.contact.whatsapp} onChange={(e) => setContact("whatsapp", e.target.value)} /></label>
          <label>YouTube<input value={content.contact.youtube} onChange={(e) => setContact("youtube", e.target.value)} /></label>
          <label>Instagram<input value={content.contact.instagram} onChange={(e) => setContact("instagram", e.target.value)} /></label>
          <label>Facebook<input value={content.contact.facebook} onChange={(e) => setContact("facebook", e.target.value)} /></label>
        </div>
        <h2 className="panel-section-title">Rodapé</h2>
        <div className="panel-grid">
          {content.footer.aboutLines.map((line, index) => (
            <label key={`about-${index}`}>Sobre — linha {index + 1}<input value={line} onChange={(e) => setAboutLine(index, e.target.value)} /></label>
          ))}
          <label>Copyright<input value={content.footer.copyright} onChange={(e) => setFooterField("copyright", e.target.value)} /></label>
          <label className="panel-full">Aviso de privacidade<textarea rows={4} value={content.footer.privacy} onChange={(e) => setFooterField("privacy", e.target.value)} /></label>
        </div>
      </>}

      {tab === "agenda" && <AgendaEditor content={content} onChange={setContent} />}
      {tab === "igreja" && <ChurchEditor content={content} onChange={setContent} />}
      {tab === "livros" && <BooksEditor content={content} onChange={setContent} />}
      </fieldset>}

      {workflowEntity && <section className="panel-publish" aria-labelledby="workflow-title">
        <div className="panel-workflow-head">
          <div><h2 className="panel-section-title" id="workflow-title">Fluxo editorial</h2>
            <p className="panel-hint">Revisão {workflow?.revision ?? 1}{workflow?.live_revision ? ` · publicada ${workflow.live_revision}` : ""}</p></div>
          <strong className="panel-workflow-status" data-status={workflow?.status ?? "draft"}>{WORKFLOW_LABELS[workflow?.status ?? "draft"]}</strong>
        </div>
        {workflow?.review_note && <p className="panel-review-note"><strong>Ajuste solicitado:</strong> {workflow.review_note}</p>}
        {(canReviewCurrent || canPublishCurrent) && <label className="panel-full">Nota da decisão<input maxLength={500} value={publishNote} onChange={(e) => setPublishNote(e.target.value)} placeholder={canReviewCurrent ? "Obrigatória ao solicitar ajustes" : "Opcional na publicação"} /></label>}
        <div className="panel-actions">
          {canEditCurrent && <button className="panel-button" type="button" onClick={() => void saveDraft()} disabled={busy}>{busy ? "Salvando…" : "Salvar rascunho"}</button>}
          {canEditCurrent && <button className="panel-button panel-button-alt" type="button" onClick={() => void submitReview()} disabled={busy}>Enviar para aprovação</button>}
          {canReviewCurrent && <button className="panel-button panel-button-danger" type="button" onClick={() => void requestChanges()} disabled={busy}>Solicitar ajustes</button>}
          {canReviewCurrent && <button className="panel-button panel-button-alt" type="button" onClick={() => void approve()} disabled={busy || workflow?.submitted_by === profile?.email}>Aprovar revisão</button>}
          {canPublishCurrent && <button className="panel-button panel-button-alt" type="button" onClick={() => void publish(null)} disabled={busy}>Publicar agora</button>}
        </div>
        {workflow?.status === "in_review" && !canReviewCurrent && <p className="panel-hint">Aguardando a decisão de outro revisor.</p>}
        {canReviewCurrent && workflow?.submitted_by === profile?.email && <p className="panel-hint">Quem enviou esta revisão não pode aprovar a própria alteração.</p>}
        {canPublishCurrent && workflowEntity !== "destaque" && <div className="panel-actions">
          <label>Agendar para<input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} /></label>
          <button className="panel-link" type="button" disabled={busy || !scheduleAt} onClick={() => void publish(new Date(scheduleAt).toISOString())}>Agendar publicação</button>
        </div>}
      </section>}

      {tab === "historico" && <>
        <p className="panel-hint">Recuperar uma versão altera apenas o rascunho da entidade e cancela seu agendamento. Revise na aba correspondente antes de publicar.</p>
        <div className="panel-history">
          {revisions.length === 0 && <p className="panel-hint">Nenhuma revisão registrada ainda.</p>}
          {revisions.map((revision) => (
            <div key={revision.id} className="panel-history-row">
              <span><strong>#{revision.id} · {revision.entity} · {revision.action}</strong>
                <small>{new Date(revision.created_at).toLocaleString("pt-BR")} · {revision.created_by || "—"} {revision.note ? `· ${revision.note}` : ""}</small></span>
              <button className="panel-link" type="button" onClick={() => void rollback(revision.id)} disabled={busy || !EDITORIAL_ENTITIES.includes(revision.entity as EditorialEntity) || !mayEditEntity(revision.entity as EditorialEntity)}>Recuperar rascunho</button>
            </div>
          ))}
        </div>
        <div className="panel-actions"><button className="panel-link" type="button" onClick={() => void loadHistory()} disabled={busy}>Atualizar histórico</button></div>
      </>}
        </div>
        {showPreview && <aside id="panel-live-preview" className="panel-preview-col">
          <section className="panel-live" aria-label="Prévia ao vivo">
            <div className="panel-live-bar">
              <strong>Prévia ao vivo</strong>
              <span className="panel-hint">{previewPath}</span>
              <div className="panel-live-devices" role="group" aria-label="Largura da prévia">
                <button type="button" className="panel-device" aria-pressed={previewWidth === "full"} data-active={previewWidth === "full"} onClick={() => setPreviewWidth("full")}>Disponível</button>
                <button type="button" className="panel-device" aria-pressed={previewWidth === "tablet"} data-active={previewWidth === "tablet"} onClick={() => setPreviewWidth("tablet")}>Até 768 px</button>
                <button type="button" className="panel-device" aria-pressed={previewWidth === "phone"} data-active={previewWidth === "phone"} onClick={() => setPreviewWidth("phone")}>Celular</button>
              </div>
              <a className="panel-link" href={previewPath} target="_blank" rel="noopener noreferrer">Abrir</a>
            </div>
            <div className="panel-live-stage" data-width={previewWidth}>
              <iframe ref={previewRef} className="panel-live-frame" title="Prévia do site" src={previewPath} onLoad={sendPreview} />
            </div>
          </section>
        </aside>}
      </div>
    </div>
  </main>;
}
