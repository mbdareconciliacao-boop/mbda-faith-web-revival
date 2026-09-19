-- Bucket de midia do site (logo, imagens gerais). Leitura publica; escrita do admin.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']
WHERE id = 'site-media';

DROP POLICY IF EXISTS site_media_public_read ON storage.objects;
CREATE POLICY site_media_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS site_media_admin_insert ON storage.objects;
CREATE POLICY site_media_admin_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS site_media_admin_update ON storage.objects;
CREATE POLICY site_media_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS site_media_admin_delete ON storage.objects;
CREATE POLICY site_media_admin_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());
