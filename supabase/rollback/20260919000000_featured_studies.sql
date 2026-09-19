-- EMERGENCY ONLY. Remove o destaque e o bucket criados pela migracao
-- 20260919000000_featured_studies. Nao roda automaticamente.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DROP POLICY IF EXISTS estudos_artes_admin_delete ON storage.objects;
DROP POLICY IF EXISTS estudos_artes_admin_update ON storage.objects;
DROP POLICY IF EXISTS estudos_artes_admin_insert ON storage.objects;
DROP POLICY IF EXISTS estudos_artes_public_read ON storage.objects;

-- Remove o bucket apenas se estiver vazio, para nao apagar artefatos do usuario.
DELETE FROM storage.buckets b
WHERE b.id = 'estudos-artes'
  AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'estudos-artes');

DROP TRIGGER IF EXISTS featured_studies_touch ON public.featured_studies;
DROP FUNCTION IF EXISTS public.touch_featured_studies();
DROP TABLE IF EXISTS public.featured_studies;
