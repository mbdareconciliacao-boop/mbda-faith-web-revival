-- EMERGENCIA. Volta as politicas genericas anteriores (menos seguras).
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DROP POLICY IF EXISTS featured_studies_admin_write ON public.featured_studies;
CREATE POLICY featured_studies_admin_write ON public.featured_studies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS estudos_artes_admin_insert ON storage.objects;
CREATE POLICY estudos_artes_admin_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'estudos-artes');

DROP POLICY IF EXISTS estudos_artes_admin_update ON storage.objects;
CREATE POLICY estudos_artes_admin_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'estudos-artes')
  WITH CHECK (bucket_id = 'estudos-artes');

DROP POLICY IF EXISTS estudos_artes_admin_delete ON storage.objects;
CREATE POLICY estudos_artes_admin_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'estudos-artes');

DROP FUNCTION IF EXISTS public.is_admin();
DROP TABLE IF EXISTS public.app_admins;
