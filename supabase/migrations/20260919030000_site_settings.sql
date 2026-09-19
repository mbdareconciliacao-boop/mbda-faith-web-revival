-- Editor do site: rascunho, publicacao e historico com rollback.
-- Leitura publica usa apenas o estado publicado; escrita so do administrador.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE IF NOT EXISTS public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT '',
  published_at timestamptz,
  published_by text NOT NULL DEFAULT '',
  CONSTRAINT site_settings_draft_object CHECK (jsonb_typeof(draft) = 'object'),
  CONSTRAINT site_settings_published_object CHECK (jsonb_typeof(published) = 'object')
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.site_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.site_settings TO authenticated;

DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.content_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity text NOT NULL,
  action text NOT NULL CHECK (action IN ('draft', 'publish', 'rollback')),
  snapshot jsonb NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT ''
);

ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.content_revisions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.content_revisions TO authenticated;

DROP POLICY IF EXISTS content_revisions_admin_read ON public.content_revisions;
CREATE POLICY content_revisions_admin_read ON public.content_revisions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS content_revisions_admin_insert ON public.content_revisions;
CREATE POLICY content_revisions_admin_insert ON public.content_revisions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_site_settings()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $touch$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$touch$;

DROP TRIGGER IF EXISTS site_settings_touch ON public.site_settings;
CREATE TRIGGER site_settings_touch
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_site_settings();

CREATE OR REPLACE FUNCTION public.publish_site_settings(p_note text DEFAULT '')
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $publish$
DECLARE
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  SELECT 'site_settings', 'publish', settings.draft, coalesce(p_note, ''), actor
  FROM public.site_settings settings WHERE settings.id;
  UPDATE public.site_settings
  SET published = draft, published_at = now(), published_by = actor
  WHERE id;
END;
$publish$;

REVOKE ALL PRIVILEGES ON FUNCTION public.publish_site_settings(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_site_settings(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rollback_site_settings(p_revision bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $rollback$
DECLARE
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  snap jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT snapshot INTO snap FROM public.content_revisions
  WHERE id = p_revision AND entity = 'site_settings';
  IF snap IS NULL THEN
    RAISE EXCEPTION 'revision not found';
  END IF;
  INSERT INTO public.content_revisions (entity, action, snapshot, note, created_by)
  VALUES ('site_settings', 'rollback', snap, 'rollback ' || p_revision, actor);
  UPDATE public.site_settings
  SET draft = snap, published = snap, published_at = now(), published_by = actor
  WHERE id;
END;
$rollback$;

REVOKE ALL PRIVILEGES ON FUNCTION public.rollback_site_settings(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rollback_site_settings(bigint) TO authenticated;

INSERT INTO public.site_settings (id, draft, published)
VALUES (
  true,
  '{
    "theme": {
      "ink": "#020817", "navy": "#06132c", "cobalt": "#075be8", "blue": "#0744b9",
      "gold": "#f3b51b", "paper": "#f5f1e8", "paperDeep": "#e9e3d8",
      "paperDeepHover": "#e2dbcf", "white": "#fffefa", "muted": "#536078",
      "line": "#d9d8d0", "navyLine": "#324867", "navyControl": "#485672",
      "navyMenuLine": "#35425e", "catalogLine": "#243b61",
      "sourceSurface": "#e8edf5", "sourceLine": "#9daec7",
      "displayFont": "Anton", "condensedFont": "Barlow Condensed", "bodyFont": "system",
      "backgroundImage": ""
    }
  }'::jsonb,
  '{
    "theme": {
      "ink": "#020817", "navy": "#06132c", "cobalt": "#075be8", "blue": "#0744b9",
      "gold": "#f3b51b", "paper": "#f5f1e8", "paperDeep": "#e9e3d8",
      "paperDeepHover": "#e2dbcf", "white": "#fffefa", "muted": "#536078",
      "line": "#d9d8d0", "navyLine": "#324867", "navyControl": "#485672",
      "navyMenuLine": "#35425e", "catalogLine": "#243b61",
      "sourceSurface": "#e8edf5", "sourceLine": "#9daec7",
      "displayFont": "Anton", "condensedFont": "Barlow Condensed", "bodyFont": "system",
      "backgroundImage": ""
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;
