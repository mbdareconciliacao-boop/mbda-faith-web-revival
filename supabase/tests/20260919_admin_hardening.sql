-- Assercoes de catalogo somente leitura.
DO $assertions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'app_admins' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'app_admins ausente ou sem RLS';
  END IF;

  IF has_table_privilege('anon', 'public.app_admins', 'SELECT')
    OR has_table_privilege('authenticated', 'public.app_admins', 'SELECT')
    OR has_table_privilege('anon', 'public.app_admins', 'INSERT')
    OR has_table_privilege('authenticated', 'public.app_admins', 'INSERT') THEN
    RAISE EXCEPTION 'app_admins exposta via API';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.app_admins WHERE email = 'mbdareconciliacao@gmail.com'
  ) THEN
    RAISE EXCEPTION 'administrador esperado ausente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.is_admin()'::regprocedure AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'is_admin() nao e SECURITY DEFINER';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated nao pode avaliar is_admin()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'featured_studies' AND policyname = 'featured_studies_admin_write'
      AND qual LIKE '%is_admin%' AND with_check LIKE '%is_admin%'
  ) THEN
    RAISE EXCEPTION 'politica do destaque nao usa is_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'estudos_artes_admin_insert'
      AND with_check LIKE '%is_admin%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'estudos_artes_admin_update'
      AND qual LIKE '%is_admin%'
  ) THEN
    RAISE EXCEPTION 'politicas de storage nao usam is_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'estudos-artes' AND file_size_limit = 5242880
      AND allowed_mime_types @> ARRAY['image/webp', 'image/jpeg', 'image/png']
  ) THEN
    RAISE EXCEPTION 'bucket de artes sem limites de tamanho/tipo';
  END IF;
END;
$assertions$;
