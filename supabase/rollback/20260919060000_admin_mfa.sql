-- EMERGENCIA. Volta o is_admin() apenas por e-mail (sem MFA).
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $is_admin$
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins admin
    WHERE admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$is_admin$;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
