-- EMERGENCIA. Remove o editor de tema e o historico.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DROP FUNCTION IF EXISTS public.rollback_site_settings(bigint);
DROP FUNCTION IF EXISTS public.publish_site_settings(text);
DROP TRIGGER IF EXISTS site_settings_touch ON public.site_settings;
DROP FUNCTION IF EXISTS public.touch_site_settings();
DROP TABLE IF EXISTS public.content_revisions;
DROP TABLE IF EXISTS public.site_settings;
