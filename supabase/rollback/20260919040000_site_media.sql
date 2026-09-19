-- EMERGENCIA. Remove o bucket de midia do site.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DROP POLICY IF EXISTS site_media_admin_delete ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_update ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_insert ON storage.objects;
DROP POLICY IF EXISTS site_media_public_read ON storage.objects;
DELETE FROM storage.buckets b
WHERE b.id = 'site-media'
  AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'site-media');
