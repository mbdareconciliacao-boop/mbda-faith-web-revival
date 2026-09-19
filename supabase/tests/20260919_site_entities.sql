-- Assercoes de catalogo somente leitura.
DO $assertions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'site_entities' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'site_entities ausente ou sem RLS';
  END IF;

  IF (SELECT count(*) FROM public.site_entities WHERE state = 'published') <> 5 THEN
    RAISE EXCEPTION 'esperadas 5 entidades publicadas';
  END IF;

  IF (SELECT count(*) FROM public.site_entities WHERE state = 'draft') <> 5 THEN
    RAISE EXCEPTION 'esperados 5 rascunhos';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'site_entities' AND policyname = 'site_entities_public_read'
      AND qual LIKE '%published%'
  ) THEN
    RAISE EXCEPTION 'leitura publica das entidades mudou';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'site_entities' AND policyname = 'site_entities_admin_all'
      AND qual LIKE '%is_admin%' AND with_check LIKE '%is_admin%'
  ) THEN
    RAISE EXCEPTION 'escrita das entidades nao exige is_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.publish_entity(text,text,timestamptz)'::regprocedure AND p.prosecdef
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.publish_due_entities()'::regprocedure AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'funcoes de publicacao/agendamento ausentes ou inseguras';
  END IF;

  IF NOT has_function_privilege('anon', 'public.publish_due_entities()', 'EXECUTE') THEN
    RAISE EXCEPTION 'agendador nao pode publicar o que venceu';
  END IF;
END;
$assertions$;
