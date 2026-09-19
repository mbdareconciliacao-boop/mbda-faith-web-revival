-- Assercoes de catalogo somente leitura.
DO $assertions$
DECLARE
  definition text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.is_admin()'::regprocedure AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'is_admin() nao e SECURITY DEFINER';
  END IF;

  SELECT pg_get_functiondef(p.oid) INTO definition
  FROM pg_proc p WHERE p.oid = 'public.is_admin()'::regprocedure;

  IF definition NOT ILIKE '%mfa_factors%' OR definition NOT ILIKE '%aal2%' THEN
    RAISE EXCEPTION 'is_admin() nao considera MFA';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated nao pode avaliar is_admin()';
  END IF;

  -- Confere que o definer consegue ler os fatores (senao o MFA fica inativo).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'mfa_factors' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'auth.mfa_factors indisponivel';
  END IF;
END;
$assertions$;
