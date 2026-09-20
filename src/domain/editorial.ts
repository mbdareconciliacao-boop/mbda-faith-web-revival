export type EditorialRole = "contributor" | "editor" | "reviewer" | "admin";
export type EditorialEntity = "destaque" | "tema" | "textos" | "agenda" | "igreja" | "livros";
export type ContentKind = "news" | "schedule" | "event" | "book";
export type EditorialStatus = "draft" | "in_review" | "changes_requested" | "approved" | "published" | "archived";
export type EditorialAction = "create" | "edit" | "submit" | "request_changes" | "approve" | "publish" | "archive";

export interface EditorialActor {
  id: string;
  role: EditorialRole;
}

export interface EditorialProfile {
  email: string;
  display_name: string;
  role: EditorialRole;
  entities: EditorialEntity[];
}

export interface EditorialWorkflow {
  entity: EditorialEntity;
  status: Exclude<EditorialStatus, "archived">;
  revision: number;
  approved_revision: number | null;
  live_revision: number | null;
  payload: Record<string, unknown>;
  owner_email: string;
  submitted_by: string;
  approved_by: string;
  review_note: string;
  scheduled_at: string | null;
  updated_at: string;
  updated_by: string;
}

export interface EditorialRecord {
  id: string;
  kind: ContentKind;
  title: string;
  ownerId: string;
  status: EditorialStatus;
  revision: number;
  approvedRevision: number | null;
  liveRevision: number | null;
  updatedBy: string;
  updatedAt: string;
}

export interface EditorialEvent {
  recordId: string;
  revision: number;
  action: EditorialAction;
  actorId: string;
  actorRole: EditorialRole;
  occurredAt: string;
  note?: string;
}

export interface EditorialResult {
  record: EditorialRecord;
  event: EditorialEvent;
}

const clean = (value: string, max: number) => value.trim().replace(/\s+/g, " ").slice(0, max);
const at = (value: Date | string = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Data editorial inválida.");
  return date.toISOString();
};
const assertId = (value: string, label: string) => {
  const result = clean(value, 120);
  if (!/^[a-zA-Z0-9:_-]{3,120}$/.test(result)) throw new Error(`${label} inválido.`);
  return result;
};
const event = (record: EditorialRecord, actor: EditorialActor, action: EditorialAction, when: string, note?: string): EditorialEvent => ({
  recordId: record.id,
  revision: record.revision,
  action,
  actorId: actor.id,
  actorRole: actor.role,
  occurredAt: when,
  ...(note ? { note: clean(note, 500) } : {}),
});
const result = (record: EditorialRecord, actor: EditorialActor, action: EditorialAction, when: string, note?: string): EditorialResult => ({
  record,
  event: event(record, actor, action, when, note),
});
const canEdit = (record: EditorialRecord, actor: EditorialActor) => actor.role === "admin" || actor.role === "editor" || (actor.role === "contributor" && record.ownerId === actor.id);
const isReviewer = (actor: EditorialActor) => actor.role === "reviewer" || actor.role === "admin";

export function createEditorialDraft(input: Pick<EditorialRecord, "id" | "kind" | "title">, actor: EditorialActor, now?: Date | string): EditorialResult {
  if (!(["contributor", "editor", "admin"] as EditorialRole[]).includes(actor.role)) throw new Error("Este papel não pode criar conteúdo.");
  const when = at(now);
  const title = clean(input.title, 180);
  if (title.length < 3) throw new Error("Título editorial muito curto.");
  const record: EditorialRecord = {
    id: assertId(input.id, "ID do conteúdo"), kind: input.kind, title,
    ownerId: assertId(actor.id, "ID do usuário"), status: "draft", revision: 1,
    approvedRevision: null, liveRevision: null, updatedBy: actor.id, updatedAt: when,
  };
  return result(record, actor, "create", when);
}

/** Edits never replace the live revision and always invalidate prior approval. */
export function reviseEditorial(record: EditorialRecord, actor: EditorialActor, title: string, now?: Date | string): EditorialResult {
  if (record.status === "archived" || record.status === "in_review") throw new Error("O conteúdo precisa sair da revisão antes de ser editado.");
  if (!canEdit(record, actor)) throw new Error("Sem permissão para editar este conteúdo.");
  const nextTitle = clean(title, 180);
  if (nextTitle.length < 3) throw new Error("Título editorial muito curto.");
  const when = at(now);
  const next = { ...record, title: nextTitle, status: "draft" as const, revision: record.revision + 1, approvedRevision: null, updatedBy: actor.id, updatedAt: when };
  return result(next, actor, "edit", when);
}

export function submitEditorial(record: EditorialRecord, actor: EditorialActor, now?: Date | string): EditorialResult {
  if (!(record.status === "draft" || record.status === "changes_requested")) throw new Error("Somente rascunhos podem ser enviados para aprovação.");
  if (!canEdit(record, actor)) throw new Error("Sem permissão para enviar este conteúdo.");
  const when = at(now);
  const next = { ...record, status: "in_review" as const, approvedRevision: null, updatedBy: actor.id, updatedAt: when };
  return result(next, actor, "submit", when);
}

export function requestEditorialChanges(record: EditorialRecord, actor: EditorialActor, note: string, now?: Date | string): EditorialResult {
  if (record.status !== "in_review" || !isReviewer(actor)) throw new Error("Somente revisores podem solicitar alterações durante a revisão.");
  if (clean(note, 500).length < 3) throw new Error("Explique a alteração solicitada.");
  const when = at(now);
  const next = { ...record, status: "changes_requested" as const, approvedRevision: null, updatedBy: actor.id, updatedAt: when };
  return result(next, actor, "request_changes", when, note);
}

export function approveEditorial(record: EditorialRecord, actor: EditorialActor, now?: Date | string): EditorialResult {
  if (record.status !== "in_review" || !isReviewer(actor)) throw new Error("Somente revisores podem aprovar conteúdo em revisão.");
  if (record.updatedBy === actor.id) throw new Error("Quem enviou a revisão não pode aprovar a própria alteração.");
  const when = at(now);
  const next = { ...record, status: "approved" as const, approvedRevision: record.revision, updatedBy: actor.id, updatedAt: when };
  return result(next, actor, "approve", when);
}

export function publishEditorial(record: EditorialRecord, actor: EditorialActor, now?: Date | string): EditorialResult {
  if (actor.role !== "admin") throw new Error("Somente administradores podem publicar.");
  if (record.status !== "approved" || record.approvedRevision !== record.revision) throw new Error("A revisão atual precisa estar aprovada antes da publicação.");
  const when = at(now);
  const next = { ...record, status: "published" as const, liveRevision: record.revision, updatedBy: actor.id, updatedAt: when };
  return result(next, actor, "publish", when);
}

export function archiveEditorial(record: EditorialRecord, actor: EditorialActor, now?: Date | string): EditorialResult {
  if (actor.role !== "admin") throw new Error("Somente administradores podem arquivar.");
  const when = at(now);
  const next = { ...record, status: "archived" as const, updatedBy: actor.id, updatedAt: when };
  return result(next, actor, "archive", when);
}
