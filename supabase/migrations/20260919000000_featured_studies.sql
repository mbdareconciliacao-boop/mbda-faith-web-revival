-- Estudo/livro da vez (painel /painel).
-- Aplicar de forma transacional, apos backup e ensaio de restauracao.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE IF NOT EXISTS public.featured_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  intro text NOT NULL DEFAULT '',
  art_480_url text NOT NULL DEFAULT '',
  art_900_url text NOT NULL DEFAULT '',
  art_alt text NOT NULL DEFAULT '',
  book_title text NOT NULL DEFAULT '',
  book_author text NOT NULL DEFAULT '',
  book_href text NOT NULL DEFAULT '',
  book_link_label text NOT NULL DEFAULT '',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT '',
  CONSTRAINT featured_studies_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 80),
  CONSTRAINT featured_studies_sources_array CHECK (jsonb_typeof(sources) = 'array'),
  CONSTRAINT featured_studies_sections_array CHECK (jsonb_typeof(sections) = 'array')
);

-- No maximo um destaque ativo por vez.
CREATE UNIQUE INDEX IF NOT EXISTS featured_studies_single_active
  ON public.featured_studies (is_active) WHERE is_active;

ALTER TABLE public.featured_studies ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.featured_studies FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.featured_studies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.featured_studies TO authenticated;

DROP POLICY IF EXISTS featured_studies_public_read ON public.featured_studies;
CREATE POLICY featured_studies_public_read ON public.featured_studies
  FOR SELECT TO anon, authenticated USING (is_active);

DROP POLICY IF EXISTS featured_studies_admin_write ON public.featured_studies;
CREATE POLICY featured_studies_admin_write ON public.featured_studies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_featured_studies()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $touch$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$touch$;

DROP TRIGGER IF EXISTS featured_studies_touch ON public.featured_studies;
CREATE TRIGGER featured_studies_touch
  BEFORE UPDATE ON public.featured_studies
  FOR EACH ROW EXECUTE FUNCTION public.touch_featured_studies();

-- Bucket publico de leitura para as artes; escrita somente autenticada.
INSERT INTO storage.buckets (id, name, public)
VALUES ('estudos-artes', 'estudos-artes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS estudos_artes_public_read ON storage.objects;
CREATE POLICY estudos_artes_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'estudos-artes');

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

-- Semente do destaque atual (idempotente). As secoes continuam no fallback
-- estatico para tessalonicenses; o campo fica pronto para a proxima fase.
INSERT INTO public.featured_studies (
  slug, title, subtitle, intro, art_480_url, art_900_url, art_alt,
  book_title, book_author, book_href, book_link_label, sources, is_active
) VALUES (
  'tessalonicenses',
  'Tessalonicenses',
  'Visão de uma igreja local',
  'Uma jornada pelas duas cartas de Paulo para descobrir como fé, amor e esperança formam uma igreja firme — enquanto ela vive o presente à luz da volta de Cristo.',
  '/images/site/blog/tessalonicenses-evento-480.webp',
  '/images/site/blog/tessalonicenses-evento-900.webp',
  'Arte da Escola Bíblica sobre a primeira e a segunda cartas de Paulo aos Tessalonicenses',
  'Tessalonicenses — visão de uma igreja local',
  'Editora Cristã Evangélica',
  'https://loja.editoracristaevangelica.com.br/cartas-aos-tessalonicenses-revista-do-aluno.html',
  'Conhecer na editora',
  '[
    {"label":"Revista na editora oficial","href":"https://loja.editoracristaevangelica.com.br/cartas-aos-tessalonicenses-revista-do-aluno.html"},
    {"label":"Ler a amostra oficial","href":"https://portal.editoracristaevangelica.com.br/media/9Kd6urRKmxIIJefs1vkn5UUu4kZkOm5I/download"},
    {"label":"Consultar no Perlego","href":"https://www.perlego.com/book/3957744/tessalonicenses-revista-do-aluno-visao-de-uma-igreja-local-pdf"}
  ]'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;
