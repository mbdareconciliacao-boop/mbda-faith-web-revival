-- Assercoes de catalogo somente leitura.
DO $assertions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'site-media' AND public AND file_size_limit = 5242880
      AND allowed_mime_types @> ARRAY['image/webp', 'image/jpeg', 'image/png']
  ) THEN
    RAISE EXCEPTION 'bucket site-media ausente ou sem limites';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'site_media_public_read'
  ) THEN
    RAISE EXCEPTION 'leitura publica do site-media ausente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'site_media_admin_insert'
      AND with_check LIKE '%is_admin%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'site_media_admin_delete'
      AND qual LIKE '%is_admin%'
  ) THEN
    RAISE EXCEPTION 'escrita do site-media nao exige is_admin';
  END IF;
END;
$assertions$;
