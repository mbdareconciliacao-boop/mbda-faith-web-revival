-- Assercoes de catalogo somente leitura.
DO $assertions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'site_settings' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'site_settings ausente ou sem RLS';
  END IF;

  IF NOT has_table_privilege('anon', 'public.site_settings', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.site_settings', 'SELECT') THEN
    RAISE EXCEPTION 'leitura publica do tema mudou';
  END IF;

  IF has_table_privilege('anon', 'public.site_settings', 'INSERT')
    OR has_table_privilege('anon', 'public.site_settings', 'UPDATE') THEN
    RAISE EXCEPTION 'anon nao pode escrever o tema';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'site_settings' AND policyname = 'site_settings_admin_write'
      AND qual LIKE '%is_admin%' AND with_check LIKE '%is_admin%'
  ) THEN
    RAISE EXCEPTION 'politica do tema nao usa is_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'content_revisions' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'content_revisions ausente ou sem RLS';
  END IF;

  IF has_table_privilege('anon', 'public.content_revisions', 'SELECT') THEN
    RAISE EXCEPTION 'historico exposto ao anon';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.publish_site_settings(text)'::regprocedure AND p.prosecdef
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.rollback_site_settings(bigint)'::regprocedure AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'funcoes de publicacao/rollback ausentes ou inseguras';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.site_settings WHERE id AND jsonb_typeof(published -> 'theme') = 'object'
  ) THEN
    RAISE EXCEPTION 'tema publicado ausente';
  END IF;
END;
$assertions$;
