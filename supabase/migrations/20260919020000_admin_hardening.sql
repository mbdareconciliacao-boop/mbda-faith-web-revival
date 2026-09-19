-- Endurece o painel: escrita restrita a uma lista de administradores.
-- Antes, qualquer usuario autenticado podia escrever (USING true). Agora a
-- autorizacao vem de public.app_admins, lida por uma funcao SECURITY DEFINER.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE IF NOT EXISTS public.app_admins (
  email text PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_admins_email_lowercase CHECK (email = lower(email))
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
-- Sem GRANT de tabela: a lista nao e acessivel via API (nem leitura).
REVOKE ALL PRIVILEGES ON TABLE public.app_admins FROM PUBLIC, anon, authenticated;

INSERT INTO public.app_admins (email, note)
VALUES ('mbdareconciliacao@gmail.com', 'Administrador do painel')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $is_admin$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_admins admin
    WHERE admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$is_admin$;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Destaque: escrita somente do administrador.
DROP POLICY IF EXISTS featured_studies_admin_write ON public.featured_studies;
CREATE POLICY featured_studies_admin_write ON public.featured_studies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage: escrita somente do administrador.
DROP POLICY IF EXISTS estudos_artes_admin_insert ON storage.objects;
CREATE POLICY estudos_artes_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'estudos-artes' AND public.is_admin());

DROP POLICY IF EXISTS estudos_artes_admin_update ON storage.objects;
CREATE POLICY estudos_artes_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'estudos-artes' AND public.is_admin())
  WITH CHECK (bucket_id = 'estudos-artes' AND public.is_admin());

DROP POLICY IF EXISTS estudos_artes_admin_delete ON storage.objects;
CREATE POLICY estudos_artes_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'estudos-artes' AND public.is_admin());

-- Limita tamanho e tipos aceitos no bucket de artes.
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']
WHERE id = 'estudos-artes';
