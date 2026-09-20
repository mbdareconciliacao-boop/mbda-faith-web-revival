-- Repara seguranca e atomicidade do painel editorial.
-- Aplicar somente apos backup e ensaio transacional conforme AGENTS.md.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

-- O frontend atual usa site_entities. A tabela legada continha draft e published
-- na mesma linha, portanto RLS por linha nunca poderia esconder somente draft.
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
REVOKE SELECT ON TABLE public.site_settings FROM anon, authenticated;

-- Escrita administrativa sempre exige a sessao no nivel aal2.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $is_admin$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    AND EXISTS (
      SELECT 1 FROM public.app_admins admin
      WHERE admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$is_admin$;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Agendamento era rejeitado porque a constraint antiga nao aceitava schedule.
ALTER TABLE public.content_revisions
  DROP CONSTRAINT IF EXISTS content_revisions_action_check;
ALTER TABLE public.content_revisions
  ADD CONSTRAINT content_revisions_action_check
  CHECK (action IN ('draft', 'publish', 'schedule', 'rollback'));

CREATE OR REPLACE FUNCTION public.publish_entity(
  p_entity text,
  p_note text DEFAULT '',
  p_publish_at timestamptz DEFAULT NULL
)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $publish$
DECLARE
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  draft jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT content INTO draft FROM public.site_entities
  WHERE entity = p_entity AND state = 'draft'
  FOR UPDATE;
  IF draft IS NULL THEN
    RAISE EXCEPTION 'draft not found';
  END IF;
  IF p_publish_at IS NOT NULL AND p_publish_at > now() THEN
    UPDATE public.site_entities
    SET publish_at = p_publish_at, updated_by = actor
    WHERE entity = p_entity AND state = 'draft';
    INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
    VALUES (p_entity, 'schedule', draft,
            coalesce(p_note, '') || ' (agendado ' || to_char(p_publish_at, 'DD/MM/YYYY HH24:MI') || ')', actor);
    RETURN p_publish_at;
  END IF;
  INSERT INTO public.site_entities (entity, state, content, published_at, publish_at, updated_by)
  VALUES (p_entity, 'published', draft, now(), NULL, actor)
  ON CONFLICT (entity, state) DO UPDATE
    SET content = EXCLUDED.content, published_at = now(), publish_at = NULL, updated_by = actor;
  UPDATE public.site_entities
  SET publish_at = NULL, updated_by = actor
  WHERE entity = p_entity AND state = 'draft';
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  VALUES (p_entity, 'publish', draft, coalesce(p_note, ''), actor);
  RETURN NULL;
END;
$publish$;

REVOKE ALL PRIVILEGES ON FUNCTION public.publish_entity(text, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_entity(text, text, timestamptz) TO authenticated;

-- Apenas uma credencial de servidor pode publicar agendamentos vencidos.
CREATE OR REPLACE FUNCTION public.publish_due_entities()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $due$
DECLARE
  row record;
  total integer := 0;
BEGIN
  FOR row IN
    SELECT entity, content, updated_by FROM public.site_entities
    WHERE state = 'draft' AND publish_at IS NOT NULL AND publish_at <= now()
    ORDER BY publish_at, entity
    FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO public.site_entities (entity, state, content, published_at, publish_at, updated_by)
    VALUES (row.entity, 'published', row.content, now(), NULL, row.updated_by)
    ON CONFLICT (entity, state) DO UPDATE
      SET content = EXCLUDED.content, published_at = now(), publish_at = NULL,
          updated_by = EXCLUDED.updated_by;
    INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
    VALUES (row.entity, 'publish', row.content, 'agendado',
            coalesce(nullif(row.updated_by, ''), 'scheduler'));
    UPDATE public.site_entities SET publish_at = NULL
    WHERE entity = row.entity AND state = 'draft';
    total := total + 1;
  END LOOP;
  RETURN total;
END;
$due$;

REVOKE ALL PRIVILEGES ON FUNCTION public.publish_due_entities() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_due_entities() TO service_role;

-- Troca o destaque em uma unica transacao: nunca deixa o site sem estudo ativo.
CREATE OR REPLACE FUNCTION public.publish_featured_study(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $study$
DECLARE
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  study_id uuid;
  study_slug text := trim(coalesce(p_payload ->> 'slug', ''));
  study_title text := trim(coalesce(p_payload ->> 'title', ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF study_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR char_length(study_slug) NOT BETWEEN 3 AND 80 OR study_title = '' THEN
    RAISE EXCEPTION 'invalid study';
  END IF;
  IF jsonb_typeof(coalesce(p_payload -> 'sources', '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'invalid sources';
  END IF;

  UPDATE public.featured_studies SET is_active = false WHERE is_active;
  INSERT INTO public.featured_studies (
    slug, title, subtitle, intro, art_480_url, art_900_url, art_alt,
    book_title, book_author, book_href, book_link_label, sources, is_active, updated_by
  ) VALUES (
    study_slug, study_title, coalesce(p_payload ->> 'subtitle', ''),
    coalesce(p_payload ->> 'intro', ''), coalesce(p_payload ->> 'art_480_url', ''),
    coalesce(p_payload ->> 'art_900_url', ''), coalesce(p_payload ->> 'art_alt', ''),
    coalesce(p_payload ->> 'book_title', ''), coalesce(p_payload ->> 'book_author', ''),
    coalesce(p_payload ->> 'book_href', ''), coalesce(p_payload ->> 'book_link_label', ''),
    coalesce(p_payload -> 'sources', '[]'::jsonb), true, actor
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, intro = EXCLUDED.intro,
    art_480_url = EXCLUDED.art_480_url, art_900_url = EXCLUDED.art_900_url,
    art_alt = EXCLUDED.art_alt, book_title = EXCLUDED.book_title,
    book_author = EXCLUDED.book_author, book_href = EXCLUDED.book_href,
    book_link_label = EXCLUDED.book_link_label, sources = EXCLUDED.sources,
    is_active = true, updated_by = actor
  RETURNING id INTO study_id;
  RETURN study_id;
END;
$study$;

REVOKE ALL PRIVILEGES ON FUNCTION public.publish_featured_study(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_featured_study(jsonb) TO authenticated;
