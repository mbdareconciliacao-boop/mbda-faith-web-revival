-- MFA para o administrador: exige aal2 SOMENTE quando houver fator TOTP verificado.
-- Assim nao ha bloqueio antes do primeiro cadastro.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $is_admin$
DECLARE
  is_listed boolean;
  has_factor boolean := false;
  current_aal text := coalesce(auth.jwt() ->> 'aal', '');
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins admin
    WHERE admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) INTO is_listed;
  IF NOT is_listed THEN
    RETURN false;
  END IF;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM auth.mfa_factors factor
      WHERE factor.user_id = auth.uid() AND factor.status = 'verified'
    ) INTO has_factor;
  EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
    has_factor := false;
  END;
  RETURN (NOT has_factor) OR current_aal = 'aal2';
END;
$is_admin$;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
