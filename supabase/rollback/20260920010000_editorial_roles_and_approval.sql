-- Rollback conservador: desativa o fluxo de equipe sem apagar seus registros.
-- Use apenas em emergencia e dentro de uma transacao aprovada.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';

DROP POLICY IF EXISTS editorial_workflow_member_read ON public.editorial_workflow;
DROP POLICY IF EXISTS content_revisions_member_read ON public.content_revisions;
DROP POLICY IF EXISTS estudos_artes_admin_insert ON storage.objects;
DROP POLICY IF EXISTS estudos_artes_admin_update ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_insert ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_update ON storage.objects;

DROP FUNCTION IF EXISTS public.restore_editorial_revision(bigint);
DROP FUNCTION IF EXISTS public.approve_editorial(text);
DROP FUNCTION IF EXISTS public.request_editorial_changes(text,text);
DROP FUNCTION IF EXISTS public.submit_editorial(text);
DROP FUNCTION IF EXISTS public.save_editorial_draft(text,jsonb);
DROP FUNCTION IF EXISTS public.get_editorial_profile();
DROP FUNCTION IF EXISTS public.can_review_editorial();
DROP FUNCTION IF EXISTS public.can_view_editorial(text);
DROP FUNCTION IF EXISTS public.can_edit_editorial(text);
DROP FUNCTION IF EXISTS public.is_editorial_member();
DROP FUNCTION IF EXISTS public.publish_featured_study();

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

GRANT INSERT, UPDATE ON TABLE public.site_entities TO authenticated;
GRANT INSERT ON TABLE public.content_revisions TO authenticated;
DROP POLICY IF EXISTS content_revisions_admin_read ON public.content_revisions;
CREATE POLICY content_revisions_admin_read ON public.content_revisions
  FOR SELECT TO authenticated USING (public.is_admin());

ALTER TABLE public.content_revisions DROP CONSTRAINT IF EXISTS content_revisions_action_check;
ALTER TABLE public.content_revisions ADD CONSTRAINT content_revisions_action_check
  CHECK (action IN ('draft','publish','schedule','rollback'));

CREATE OR REPLACE FUNCTION public.publish_entity(p_entity text, p_note text DEFAULT '', p_publish_at timestamptz DEFAULT NULL)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $publish$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); draft jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT content INTO draft FROM public.site_entities WHERE entity=p_entity AND state='draft' FOR UPDATE;
  IF draft IS NULL THEN RAISE EXCEPTION 'draft not found'; END IF;
  IF p_publish_at IS NOT NULL AND p_publish_at > now() THEN
    UPDATE public.site_entities SET publish_at=p_publish_at,updated_by=actor WHERE entity=p_entity AND state='draft';
    INSERT INTO public.content_revisions(entity,action,snapshot,note,created_by) VALUES(p_entity,'schedule',draft,left(coalesce(p_note,''),500),actor);
    RETURN p_publish_at;
  END IF;
  INSERT INTO public.site_entities(entity,state,content,published_at,publish_at,updated_by)
  VALUES(p_entity,'published',draft,now(),NULL,actor)
  ON CONFLICT(entity,state) DO UPDATE SET content=EXCLUDED.content,published_at=now(),publish_at=NULL,updated_by=actor;
  UPDATE public.site_entities SET publish_at=NULL WHERE entity=p_entity AND state='draft';
  INSERT INTO public.content_revisions(entity,action,snapshot,note,created_by) VALUES(p_entity,'publish',draft,left(coalesce(p_note,''),500),actor);
  RETURN NULL;
END;
$publish$;
REVOKE ALL PRIVILEGES ON FUNCTION public.publish_entity(text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_entity(text,text,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_featured_study(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $study$
DECLARE actor text := lower(coalesce(auth.jwt() ->> 'email', '')); study_id uuid; study_slug text := trim(coalesce(p_payload->>'slug','')); study_title text := trim(coalesce(p_payload->>'title',''));
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF study_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(study_slug) NOT BETWEEN 3 AND 80 OR study_title='' THEN RAISE EXCEPTION 'invalid study'; END IF;
  UPDATE public.featured_studies SET is_active=false WHERE is_active;
  INSERT INTO public.featured_studies(slug,title,subtitle,intro,art_480_url,art_900_url,art_alt,book_title,book_author,book_href,book_link_label,sources,sections,is_active,updated_by)
  VALUES(study_slug,study_title,coalesce(p_payload->>'subtitle',''),coalesce(p_payload->>'intro',''),coalesce(p_payload->>'art_480_url',''),coalesce(p_payload->>'art_900_url',''),coalesce(p_payload->>'art_alt',''),coalesce(p_payload->>'book_title',''),coalesce(p_payload->>'book_author',''),coalesce(p_payload->>'book_href',''),coalesce(p_payload->>'book_link_label',''),coalesce(p_payload->'sources','[]'::jsonb),coalesce(p_payload->'sections','[]'::jsonb),true,actor)
  ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,intro=EXCLUDED.intro,art_480_url=EXCLUDED.art_480_url,art_900_url=EXCLUDED.art_900_url,art_alt=EXCLUDED.art_alt,book_title=EXCLUDED.book_title,book_author=EXCLUDED.book_author,book_href=EXCLUDED.book_href,book_link_label=EXCLUDED.book_link_label,sources=EXCLUDED.sources,sections=EXCLUDED.sections,is_active=true,updated_by=actor
  RETURNING id INTO study_id;
  RETURN study_id;
END;
$study$;
REVOKE ALL PRIVILEGES ON FUNCTION public.publish_featured_study(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_featured_study(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_due_entities()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $due$
DECLARE row record; total integer := 0;
BEGIN
  FOR row IN SELECT entity,content,updated_by FROM public.site_entities
    WHERE state='draft' AND publish_at IS NOT NULL AND publish_at<=now()
    ORDER BY publish_at,entity FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO public.site_entities(entity,state,content,published_at,publish_at,updated_by)
    VALUES(row.entity,'published',row.content,now(),NULL,row.updated_by)
    ON CONFLICT(entity,state) DO UPDATE SET content=EXCLUDED.content,published_at=now(),publish_at=NULL,updated_by=EXCLUDED.updated_by;
    UPDATE public.site_entities SET publish_at=NULL WHERE entity=row.entity AND state='draft';
    INSERT INTO public.content_revisions(entity,action,snapshot,note,created_by) VALUES(row.entity,'publish',row.content,'agendado','scheduler');
    total := total + 1;
  END LOOP;
  RETURN total;
END;
$due$;
REVOKE ALL PRIVILEGES ON FUNCTION public.publish_due_entities() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_due_entities() TO service_role;

DROP POLICY IF EXISTS estudos_artes_admin_insert ON storage.objects;
CREATE POLICY estudos_artes_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='estudos-artes' AND public.is_admin());
DROP POLICY IF EXISTS estudos_artes_admin_update ON storage.objects;
CREATE POLICY estudos_artes_admin_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='estudos-artes' AND public.is_admin()) WITH CHECK (bucket_id='estudos-artes' AND public.is_admin());
DROP POLICY IF EXISTS site_media_admin_insert ON storage.objects;
CREATE POLICY site_media_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='site-media' AND public.is_admin());
DROP POLICY IF EXISTS site_media_admin_update ON storage.objects;
CREATE POLICY site_media_admin_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='site-media' AND public.is_admin()) WITH CHECK (bucket_id='site-media' AND public.is_admin());

-- A tabela e as colunas de equipe permanecem para evitar perda de auditoria.
REVOKE ALL PRIVILEGES ON TABLE public.editorial_workflow FROM PUBLIC, anon, authenticated;
