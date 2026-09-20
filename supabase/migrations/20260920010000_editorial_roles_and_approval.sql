-- Equipe editorial com separacao entre edicao, revisao e publicacao.
-- Aplicar somente apos backup, ensaio transacional e aprovacao humana.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';

ALTER TABLE public.app_admins ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'contributor';
ALTER TABLE public.app_admins ADD COLUMN IF NOT EXISTS entities text[] NOT NULL
  DEFAULT ARRAY[]::text[];
ALTER TABLE public.app_admins ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '';
ALTER TABLE public.app_admins ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.app_admins DROP CONSTRAINT IF EXISTS app_admins_role_check;
ALTER TABLE public.app_admins ADD CONSTRAINT app_admins_role_check
  CHECK (role IN ('contributor', 'editor', 'reviewer', 'admin'));
ALTER TABLE public.app_admins DROP CONSTRAINT IF EXISTS app_admins_entities_check;
ALTER TABLE public.app_admins ADD CONSTRAINT app_admins_entities_check CHECK (
  entities <@ ARRAY['destaque','tema','textos','agenda','igreja','livros']::text[]
);

UPDATE public.app_admins SET role = 'admin', active = true
WHERE email = 'mbdareconciliacao@gmail.com';

CREATE OR REPLACE FUNCTION public.is_editorial_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $member$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    AND EXISTS (
      SELECT 1 FROM public.app_admins member
      WHERE member.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND member.active
    );
$member$;
REVOKE ALL PRIVILEGES ON FUNCTION public.is_editorial_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_editorial_member() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $admin$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    AND EXISTS (
      SELECT 1 FROM public.app_admins member
      WHERE member.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND member.active AND member.role = 'admin'
    );
$admin$;
REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_edit_editorial(p_entity text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $edit$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    AND EXISTS (
      SELECT 1 FROM public.app_admins member
      WHERE member.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND member.active
        AND member.role IN ('contributor', 'editor', 'admin')
        AND (member.role = 'admin' OR p_entity = ANY(member.entities))
    );
$edit$;
REVOKE ALL PRIVILEGES ON FUNCTION public.can_edit_editorial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_editorial(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_view_editorial(p_entity text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $view$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    AND EXISTS (
      SELECT 1 FROM public.app_admins member
      WHERE member.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND member.active
        AND (
          member.role IN ('reviewer', 'admin')
          OR p_entity = ANY(member.entities)
        )
    );
$view$;
REVOKE ALL PRIVILEGES ON FUNCTION public.can_view_editorial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_editorial(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_review_editorial()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $review$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    AND EXISTS (
      SELECT 1 FROM public.app_admins member
      WHERE member.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND member.active AND member.role IN ('reviewer', 'admin')
    );
$review$;
REVOKE ALL PRIVILEGES ON FUNCTION public.can_review_editorial() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_review_editorial() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_editorial_profile()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $profile$
  SELECT jsonb_build_object(
    'email', member.email,
    'display_name', member.display_name,
    'role', member.role,
    'entities', member.entities
  )
  FROM public.app_admins member
  WHERE member.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND member.active
    AND coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$profile$;
REVOKE ALL PRIVILEGES ON FUNCTION public.get_editorial_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_editorial_profile() TO authenticated;

CREATE TABLE IF NOT EXISTS public.editorial_workflow (
  entity text PRIMARY KEY CHECK (entity IN ('destaque','tema','textos','agenda','igreja','livros')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','changes_requested','approved','published')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  approved_revision integer,
  live_revision integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  owner_email text NOT NULL DEFAULT '',
  submitted_by text NOT NULL DEFAULT '',
  approved_by text NOT NULL DEFAULT '',
  review_note text NOT NULL DEFAULT '',
  scheduled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT ''
);

ALTER TABLE public.editorial_workflow ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.editorial_workflow FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.editorial_workflow TO authenticated;
DROP POLICY IF EXISTS editorial_workflow_member_read ON public.editorial_workflow;
CREATE POLICY editorial_workflow_member_read ON public.editorial_workflow
  FOR SELECT TO authenticated USING (public.can_view_editorial(entity));

-- Nenhum navegador escreve diretamente nas tabelas editoriais.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.site_entities FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.content_revisions FROM authenticated;

DROP POLICY IF EXISTS content_revisions_admin_read ON public.content_revisions;
DROP POLICY IF EXISTS content_revisions_member_read ON public.content_revisions;
CREATE POLICY content_revisions_member_read ON public.content_revisions
  FOR SELECT TO authenticated USING (public.can_view_editorial(entity));

ALTER TABLE public.content_revisions DROP CONSTRAINT IF EXISTS content_revisions_action_check;
ALTER TABLE public.content_revisions ADD CONSTRAINT content_revisions_action_check CHECK (
  action IN ('draft','submit','request_changes','approve','publish','schedule','rollback')
);

INSERT INTO public.editorial_workflow (
  entity, status, revision, approved_revision, live_revision, payload,
  owner_email, approved_by, updated_by
)
SELECT draft.entity, 'draft', 1, NULL, 1, draft.content,
       coalesce(nullif(draft.updated_by, ''), 'mbdareconciliacao@gmail.com'),
       'mbdareconciliacao@gmail.com',
       coalesce(nullif(draft.updated_by, ''), 'mbdareconciliacao@gmail.com')
FROM public.site_entities draft
WHERE draft.state = 'draft'
ON CONFLICT (entity) DO NOTHING;

INSERT INTO public.editorial_workflow (
  entity, status, revision, approved_revision, live_revision, payload,
  owner_email, approved_by, updated_by
)
SELECT 'destaque', 'published', 1, 1, 1,
       jsonb_build_object(
         'slug', study.slug, 'title', study.title, 'subtitle', study.subtitle,
         'intro', study.intro, 'art_480_url', study.art_480_url,
         'art_900_url', study.art_900_url, 'art_alt', study.art_alt,
         'book_title', study.book_title, 'book_author', study.book_author,
         'book_href', study.book_href, 'book_link_label', study.book_link_label,
         'sources', study.sources, 'sections', study.sections
       ),
       coalesce(nullif(study.updated_by, ''), 'mbdareconciliacao@gmail.com'),
       'mbdareconciliacao@gmail.com',
       coalesce(nullif(study.updated_by, ''), 'mbdareconciliacao@gmail.com')
FROM public.featured_studies study
WHERE study.is_active
ON CONFLICT (entity) DO NOTHING;

CREATE OR REPLACE FUNCTION public.save_editorial_draft(p_entity text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $save$
DECLARE
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  current_row public.editorial_workflow%ROWTYPE;
  next_revision integer;
  changed boolean;
  saved jsonb;
BEGIN
  IF p_entity NOT IN ('destaque','tema','textos','agenda','igreja','livros')
     OR jsonb_typeof(p_payload) <> 'object'
     OR pg_column_size(p_payload) > 1048576 THEN
    RAISE EXCEPTION 'invalid editorial payload';
  END IF;
  IF NOT public.can_edit_editorial(p_entity) THEN RAISE EXCEPTION 'not authorized'; END IF;

  SELECT * INTO current_row FROM public.editorial_workflow
  WHERE entity = p_entity FOR UPDATE;
  IF FOUND AND current_row.status = 'in_review' THEN
    RAISE EXCEPTION 'content is under review';
  END IF;

  changed := NOT FOUND OR current_row.payload IS DISTINCT FROM p_payload;
  next_revision := CASE WHEN NOT FOUND THEN 1 WHEN changed THEN current_row.revision + 1 ELSE current_row.revision END;

  IF p_entity <> 'destaque' THEN
    INSERT INTO public.site_entities (entity, state, content, publish_at, updated_by)
    VALUES (p_entity, 'draft', p_payload, NULL, actor)
    ON CONFLICT (entity, state) DO UPDATE SET
      content = EXCLUDED.content,
      publish_at = CASE WHEN public.site_entities.content IS DISTINCT FROM EXCLUDED.content THEN NULL ELSE public.site_entities.publish_at END,
      updated_by = actor;
  END IF;

  INSERT INTO public.editorial_workflow (
    entity, status, revision, approved_revision, payload, owner_email,
    submitted_by, approved_by, review_note, scheduled_at, updated_by
  ) VALUES (
    p_entity, 'draft', next_revision, NULL, p_payload, actor,
    '', '', '', NULL, actor
  )
  ON CONFLICT (entity) DO UPDATE SET
    payload = EXCLUDED.payload,
    revision = next_revision,
    status = CASE WHEN changed THEN 'draft' ELSE public.editorial_workflow.status END,
    approved_revision = CASE WHEN changed THEN NULL ELSE public.editorial_workflow.approved_revision END,
    submitted_by = CASE WHEN changed THEN '' ELSE public.editorial_workflow.submitted_by END,
    approved_by = CASE WHEN changed THEN '' ELSE public.editorial_workflow.approved_by END,
    review_note = CASE WHEN changed THEN '' ELSE public.editorial_workflow.review_note END,
    scheduled_at = CASE WHEN changed THEN NULL ELSE public.editorial_workflow.scheduled_at END,
    updated_at = now(), updated_by = actor;

  IF changed THEN
    INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
    VALUES (p_entity, 'draft', p_payload, 'rascunho salvo', actor);
  END IF;
  SELECT to_jsonb(flow) INTO saved FROM public.editorial_workflow flow WHERE entity = p_entity;
  RETURN saved;
END;
$save$;
REVOKE ALL PRIVILEGES ON FUNCTION public.save_editorial_draft(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_editorial_draft(text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_editorial(p_entity text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $submit$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); flow public.editorial_workflow%ROWTYPE;
BEGIN
  IF NOT public.can_edit_editorial(p_entity) THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO flow FROM public.editorial_workflow WHERE entity = p_entity FOR UPDATE;
  IF NOT FOUND OR flow.status NOT IN ('draft','changes_requested') THEN RAISE EXCEPTION 'draft not ready'; END IF;
  UPDATE public.editorial_workflow SET status='in_review', approved_revision=NULL,
    submitted_by=actor, approved_by='', review_note='', scheduled_at=NULL,
    updated_at=now(), updated_by=actor WHERE entity=p_entity RETURNING * INTO flow;
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  VALUES (p_entity, 'submit', flow.payload, 'enviado para aprovacao', actor);
  RETURN to_jsonb(flow);
END;
$submit$;
REVOKE ALL PRIVILEGES ON FUNCTION public.submit_editorial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_editorial(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_editorial_changes(p_entity text, p_note text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $changes$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); flow public.editorial_workflow%ROWTYPE; clean_note text := trim(coalesce(p_note,''));
BEGIN
  IF NOT public.can_review_editorial() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF char_length(clean_note) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'review note required'; END IF;
  SELECT * INTO flow FROM public.editorial_workflow WHERE entity=p_entity FOR UPDATE;
  IF NOT FOUND OR flow.status <> 'in_review' THEN RAISE EXCEPTION 'content is not under review'; END IF;
  UPDATE public.editorial_workflow SET status='changes_requested', approved_revision=NULL,
    approved_by='', review_note=clean_note, updated_at=now(), updated_by=actor
    WHERE entity=p_entity RETURNING * INTO flow;
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  VALUES (p_entity, 'request_changes', flow.payload, clean_note, actor);
  RETURN to_jsonb(flow);
END;
$changes$;
REVOKE ALL PRIVILEGES ON FUNCTION public.request_editorial_changes(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_editorial_changes(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_editorial(p_entity text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $approve$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); flow public.editorial_workflow%ROWTYPE;
BEGIN
  IF NOT public.can_review_editorial() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO flow FROM public.editorial_workflow WHERE entity=p_entity FOR UPDATE;
  IF NOT FOUND OR flow.status <> 'in_review' THEN RAISE EXCEPTION 'content is not under review'; END IF;
  IF flow.submitted_by = actor THEN RAISE EXCEPTION 'self approval is not allowed'; END IF;
  UPDATE public.editorial_workflow SET status='approved', approved_revision=revision,
    approved_by=actor, review_note='', updated_at=now(), updated_by=actor
    WHERE entity=p_entity RETURNING * INTO flow;
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  VALUES (p_entity, 'approve', flow.payload, 'revisao aprovada', actor);
  RETURN to_jsonb(flow);
END;
$approve$;
REVOKE ALL PRIVILEGES ON FUNCTION public.approve_editorial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_editorial(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_entity(p_entity text, p_note text DEFAULT '', p_publish_at timestamptz DEFAULT NULL)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $publish$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); flow public.editorial_workflow%ROWTYPE;
BEGIN
  IF NOT public.is_admin() OR p_entity NOT IN ('tema','textos','agenda','igreja','livros') THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO flow FROM public.editorial_workflow WHERE entity=p_entity FOR UPDATE;
  IF NOT FOUND OR flow.status <> 'approved' OR flow.approved_revision <> flow.revision THEN RAISE EXCEPTION 'current revision is not approved'; END IF;
  IF p_publish_at IS NOT NULL AND p_publish_at > now() THEN
    UPDATE public.site_entities SET publish_at=p_publish_at, updated_by=actor WHERE entity=p_entity AND state='draft';
    UPDATE public.editorial_workflow SET scheduled_at=p_publish_at, updated_at=now(), updated_by=actor WHERE entity=p_entity;
    INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
    VALUES (p_entity, 'schedule', flow.payload, left(coalesce(p_note,''),500), actor);
    RETURN p_publish_at;
  END IF;
  INSERT INTO public.site_entities (entity,state,content,published_at,publish_at,updated_by)
  VALUES (p_entity,'published',flow.payload,now(),NULL,actor)
  ON CONFLICT (entity,state) DO UPDATE SET content=EXCLUDED.content,published_at=now(),publish_at=NULL,updated_by=actor;
  UPDATE public.site_entities SET publish_at=NULL WHERE entity=p_entity AND state='draft';
  UPDATE public.editorial_workflow SET status='published',live_revision=revision,scheduled_at=NULL,updated_at=now(),updated_by=actor WHERE entity=p_entity;
  INSERT INTO public.content_revisions (entity,action,snapshot,note,created_by)
  VALUES (p_entity,'publish',flow.payload,left(coalesce(p_note,''),500),actor);
  RETURN NULL;
END;
$publish$;
REVOKE ALL PRIVILEGES ON FUNCTION public.publish_entity(text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_entity(text,text,timestamptz) TO authenticated;

DROP FUNCTION IF EXISTS public.publish_featured_study(jsonb);
CREATE OR REPLACE FUNCTION public.publish_featured_study()
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $study$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); flow public.editorial_workflow%ROWTYPE; payload jsonb; study_id uuid; study_slug text; study_title text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO flow FROM public.editorial_workflow WHERE entity='destaque' FOR UPDATE;
  IF NOT FOUND OR flow.status <> 'approved' OR flow.approved_revision <> flow.revision THEN RAISE EXCEPTION 'current revision is not approved'; END IF;
  payload := flow.payload; study_slug := trim(coalesce(payload->>'slug','')); study_title := trim(coalesce(payload->>'title',''));
  IF study_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(study_slug) NOT BETWEEN 3 AND 80 OR study_title='' THEN RAISE EXCEPTION 'invalid study'; END IF;
  IF jsonb_typeof(coalesce(payload->'sources','[]'::jsonb)) <> 'array' OR jsonb_typeof(coalesce(payload->'sections','[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'invalid study arrays'; END IF;
  UPDATE public.featured_studies SET is_active=false WHERE is_active;
  INSERT INTO public.featured_studies (slug,title,subtitle,intro,art_480_url,art_900_url,art_alt,book_title,book_author,book_href,book_link_label,sources,sections,is_active,updated_by)
  VALUES (study_slug,study_title,coalesce(payload->>'subtitle',''),coalesce(payload->>'intro',''),coalesce(payload->>'art_480_url',''),coalesce(payload->>'art_900_url',''),coalesce(payload->>'art_alt',''),coalesce(payload->>'book_title',''),coalesce(payload->>'book_author',''),coalesce(payload->>'book_href',''),coalesce(payload->>'book_link_label',''),coalesce(payload->'sources','[]'::jsonb),coalesce(payload->'sections','[]'::jsonb),true,actor)
  ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,intro=EXCLUDED.intro,art_480_url=EXCLUDED.art_480_url,art_900_url=EXCLUDED.art_900_url,art_alt=EXCLUDED.art_alt,book_title=EXCLUDED.book_title,book_author=EXCLUDED.book_author,book_href=EXCLUDED.book_href,book_link_label=EXCLUDED.book_link_label,sources=EXCLUDED.sources,sections=EXCLUDED.sections,is_active=true,updated_by=actor
  RETURNING id INTO study_id;
  UPDATE public.editorial_workflow SET status='published',live_revision=revision,scheduled_at=NULL,updated_at=now(),updated_by=actor WHERE entity='destaque';
  INSERT INTO public.content_revisions (entity,action,snapshot,note,created_by) VALUES ('destaque','publish',payload,'destaque publicado',actor);
  RETURN study_id;
END;
$study$;
REVOKE ALL PRIVILEGES ON FUNCTION public.publish_featured_study() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_featured_study() TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_editorial_revision(p_revision bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $restore$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); source public.content_revisions%ROWTYPE; flow public.editorial_workflow%ROWTYPE;
BEGIN
  SELECT * INTO source FROM public.content_revisions WHERE id=p_revision;
  IF NOT FOUND OR NOT public.can_edit_editorial(source.entity) THEN RAISE EXCEPTION 'revision not available'; END IF;
  IF source.entity <> 'destaque' THEN
    INSERT INTO public.site_entities (entity,state,content,publish_at,updated_by) VALUES (source.entity,'draft',source.snapshot,NULL,actor)
    ON CONFLICT (entity,state) DO UPDATE SET content=EXCLUDED.content,publish_at=NULL,updated_by=actor;
  END IF;
  INSERT INTO public.editorial_workflow (entity,status,revision,payload,owner_email,updated_by)
  VALUES (source.entity,'draft',1,source.snapshot,actor,actor)
  ON CONFLICT (entity) DO UPDATE SET status='draft',revision=public.editorial_workflow.revision+1,approved_revision=NULL,payload=source.snapshot,submitted_by='',approved_by='',review_note='',scheduled_at=NULL,updated_at=now(),updated_by=actor
  RETURNING * INTO flow;
  INSERT INTO public.content_revisions (entity,action,snapshot,note,created_by)
  VALUES (source.entity,'rollback',source.snapshot,'revisao '||p_revision||' recuperada como rascunho',actor);
  RETURN to_jsonb(flow);
END;
$restore$;
REVOKE ALL PRIVILEGES ON FUNCTION public.restore_editorial_revision(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_editorial_revision(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_due_entities()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $due$
DECLARE row record; total integer := 0;
BEGIN
  FOR row IN
    SELECT draft.entity, flow.payload, draft.updated_by, flow.revision
    FROM public.site_entities draft
    JOIN public.editorial_workflow flow ON flow.entity=draft.entity
    WHERE draft.state='draft' AND draft.publish_at IS NOT NULL AND draft.publish_at<=now()
      AND flow.status='approved' AND flow.approved_revision=flow.revision
    ORDER BY draft.publish_at,draft.entity FOR UPDATE OF draft SKIP LOCKED
  LOOP
    INSERT INTO public.site_entities (entity,state,content,published_at,publish_at,updated_by)
    VALUES (row.entity,'published',row.payload,now(),NULL,row.updated_by)
    ON CONFLICT (entity,state) DO UPDATE SET content=EXCLUDED.content,published_at=now(),publish_at=NULL,updated_by=EXCLUDED.updated_by;
    UPDATE public.site_entities SET publish_at=NULL WHERE entity=row.entity AND state='draft';
    UPDATE public.editorial_workflow SET status='published',live_revision=revision,scheduled_at=NULL,updated_at=now(),updated_by='scheduler' WHERE entity=row.entity;
    INSERT INTO public.content_revisions (entity,action,snapshot,note,created_by) VALUES (row.entity,'publish',row.payload,'agendado','scheduler');
    total := total + 1;
  END LOOP;
  RETURN total;
END;
$due$;
REVOKE ALL PRIVILEGES ON FUNCTION public.publish_due_entities() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_due_entities() TO service_role;

-- Upload segue as mesmas permissoes do conteudo; exclusao permanece administrativa.
DROP POLICY IF EXISTS estudos_artes_admin_insert ON storage.objects;
CREATE POLICY estudos_artes_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='estudos-artes' AND public.can_edit_editorial('destaque'));
DROP POLICY IF EXISTS estudos_artes_admin_update ON storage.objects;

DROP POLICY IF EXISTS site_media_admin_insert ON storage.objects;
CREATE POLICY site_media_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='site-media' AND (public.can_edit_editorial('tema') OR public.can_edit_editorial('textos')));
DROP POLICY IF EXISTS site_media_admin_update ON storage.objects;
