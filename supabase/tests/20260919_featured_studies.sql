-- Assercoes de catalogo somente leitura. Seguras em producao; nunca escrevem.
DO $assertions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'featured_studies'
      AND c.relkind IN ('r', 'p') AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'featured_studies ausente ou sem RLS';
  END IF;

  IF NOT has_table_privilege('anon', 'public.featured_studies', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.featured_studies', 'SELECT') THEN
    RAISE EXCEPTION 'Leitura publica do destaque mudou';
  END IF;

  IF has_table_privilege('anon', 'public.featured_studies', 'INSERT')
    OR has_table_privilege('anon', 'public.featured_studies', 'UPDATE')
    OR has_table_privilege('anon', 'public.featured_studies', 'DELETE') THEN
    RAISE EXCEPTION 'anon nao pode escrever no destaque';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.featured_studies', 'INSERT')
    OR NOT has_table_privilege('authenticated', 'public.featured_studies', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated perdeu a escrita do destaque';
  END IF;

  IF (SELECT count(*) FROM public.featured_studies WHERE is_active) <> 1 THEN
    RAISE EXCEPTION 'Esperado exatamente um destaque ativo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'featured_studies' AND cmd = 'SELECT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'featured_studies' AND cmd = 'ALL' AND roles @> ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'Politicas do destaque ausentes';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public'
      AND tablename = 'featured_studies' AND indexname = 'featured_studies_single_active'
  ) THEN
    RAISE EXCEPTION 'Indice de destaque unico ausente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'estudos-artes' AND public
  ) THEN
    RAISE EXCEPTION 'Bucket de artes ausente ou privado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'estudos_artes_public_read'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'estudos_artes_admin_insert'
  ) THEN
    RAISE EXCEPTION 'Politicas do bucket de artes ausentes';
  END IF;
END;
$assertions$;
