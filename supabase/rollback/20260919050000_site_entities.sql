-- EMERGENCIA. Remove o fluxo por entidade.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DROP FUNCTION IF EXISTS public.publish_due_entities();
DROP FUNCTION IF EXISTS public.publish_entity(text, text, timestamptz);
DROP TRIGGER IF EXISTS site_entities_touch ON public.site_entities;
DROP FUNCTION IF EXISTS public.touch_site_entities();
DROP TABLE IF EXISTS public.site_entities;
