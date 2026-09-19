-- Fase 4: rascunho, publicacao e agendamento por entidade.
-- Uma linha por (entidade, estado). O publico le apenas o estado publicado.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE IF NOT EXISTS public.site_entities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity text NOT NULL CHECK (entity IN ('tema', 'textos', 'agenda', 'igreja', 'livros')),
  state text NOT NULL CHECK (state IN ('draft', 'published')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  publish_at timestamptz,
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT '',
  CONSTRAINT site_entities_object CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT site_entities_unique UNIQUE (entity, state)
);

ALTER TABLE public.site_entities ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.site_entities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_entities TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.site_entities TO authenticated;

DROP POLICY IF EXISTS site_entities_public_read ON public.site_entities;
CREATE POLICY site_entities_public_read ON public.site_entities
  FOR SELECT TO anon, authenticated USING (state = 'published');

DROP POLICY IF EXISTS site_entities_admin_all ON public.site_entities;
CREATE POLICY site_entities_admin_all ON public.site_entities
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_site_entities()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $touch$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$touch$;

DROP TRIGGER IF EXISTS site_entities_touch ON public.site_entities;
CREATE TRIGGER site_entities_touch
  BEFORE UPDATE ON public.site_entities
  FOR EACH ROW EXECUTE FUNCTION public.touch_site_entities();

-- Publica agora ou agenda (retorna o instante agendado, ou null se publicou).
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
  SELECT content INTO draft FROM public.site_entities WHERE entity = p_entity AND state = 'draft';
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
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  VALUES (p_entity, 'publish', draft, coalesce(p_note, ''), actor);
  RETURN NULL;
END;
$publish$;

REVOKE ALL PRIVILEGES ON FUNCTION public.publish_entity(text, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_entity(text, text, timestamptz) TO authenticated;

-- Publica o que venceu o agendamento. Seguro: so age no que ja foi agendado pelo admin.
CREATE OR REPLACE FUNCTION public.publish_due_entities()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $due$
DECLARE
  row record;
  total integer := 0;
BEGIN
  FOR row IN
    SELECT entity, content FROM public.site_entities
    WHERE state = 'draft' AND publish_at IS NOT NULL AND publish_at <= now()
  LOOP
    INSERT INTO public.site_entities (entity, state, content, published_at, publish_at)
    VALUES (row.entity, 'published', row.content, now(), NULL)
    ON CONFLICT (entity, state) DO UPDATE
      SET content = EXCLUDED.content, published_at = now(), publish_at = NULL;
    INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
    VALUES (row.entity, 'publish', row.content, 'agendado', 'scheduler');
    UPDATE public.site_entities SET publish_at = NULL
    WHERE entity = row.entity AND state = 'draft';
    total := total + 1;
  END LOOP;
  RETURN total;
END;
$due$;

REVOKE ALL PRIVILEGES ON FUNCTION public.publish_due_entities() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_due_entities() TO anon, authenticated, service_role;

-- Semeia as entidades a partir do que ja estiver publicado.
WITH s AS (SELECT published AS p FROM public.site_settings WHERE id)
INSERT INTO public.site_entities (entity, state, content)
SELECT v.entity, st.state,
  CASE v.entity
    WHEN 'tema' THEN coalesce(s.p -> 'theme', '{}'::jsonb)
    WHEN 'textos' THEN coalesce(s.p -> 'content', '{}'::jsonb) - 'agenda' - 'church' - 'books'
    WHEN 'agenda' THEN jsonb_build_object('agenda', coalesce(s.p -> 'content' -> 'agenda', '{}'::jsonb))
    WHEN 'igreja' THEN jsonb_build_object('church', coalesce(s.p -> 'content' -> 'church', '{}'::jsonb))
    WHEN 'livros' THEN jsonb_build_object('books', coalesce(s.p -> 'content' -> 'books', '[]'::jsonb))
  END
FROM (VALUES ('tema'), ('textos'), ('agenda'), ('igreja'), ('livros')) v(entity)
CROSS JOIN (VALUES ('draft'), ('published')) st(state)
CROSS JOIN s
ON CONFLICT (entity, state) DO NOTHING;
