import { thessaloniansStudy } from "./tessalonians";

export interface FeaturedStudySource {
  label: string;
  href: string;
}

export interface FeaturedStudySection {
  navLabel: string;
  title: string;
  lessonRange: string;
  reading: string;
  summary: string;
  keywords: string[];
  context: string;
  keyPoints: string[];
  application: string;
  questions: string[];
}

export interface FeaturedStudy {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  art480: string;
  art900: string;
  artAlt: string;
  book: {
    title: string;
    author: string;
    href?: string;
    linkLabel?: string;
  };
  sources: FeaturedStudySource[];
  sections: FeaturedStudySection[];
}

// Conteúdo atual do site. Serve de fallback imediato e de origem das seções
// enquanto a próxima fase do painel não edita o roteiro lição a lição.
export const DEFAULT_FEATURED_STUDY: FeaturedStudy = {
  slug: "tessalonicenses",
  title: "Tessalonicenses",
  subtitle: "Visão de uma igreja local",
  intro:
    "Uma jornada pelas duas cartas de Paulo para descobrir como fé, amor e esperança formam uma igreja firme — enquanto ela vive o presente à luz da volta de Cristo.",
  art480: "/images/site/blog/tessalonicenses-evento-480.webp",
  art900: "/images/site/blog/tessalonicenses-evento-900.webp",
  artAlt:
    "Arte da Escola Bíblica sobre a primeira e a segunda cartas de Paulo aos Tessalonicenses",
  book: {
    title: "Tessalonicenses — visão de uma igreja local",
    author: "Editora Cristã Evangélica",
    href: "https://loja.editoracristaevangelica.com.br/cartas-aos-tessalonicenses-revista-do-aluno.html",
    linkLabel: "Conhecer na editora",
  },
  sources: [
    {
      label: "Revista na editora oficial",
      href: "https://loja.editoracristaevangelica.com.br/cartas-aos-tessalonicenses-revista-do-aluno.html",
    },
    {
      label: "Ler a amostra oficial",
      href: "https://portal.editoracristaevangelica.com.br/media/9Kd6urRKmxIIJefs1vkn5UUu4kZkOm5I/download",
    },
    {
      label: "Consultar no Perlego",
      href: "https://www.perlego.com/book/3957744/tessalonicenses-revista-do-aluno-visao-de-uma-igreja-local-pdf",
    },
  ],
  sections: thessaloniansStudy,
};

const asText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const isSource = (value: unknown): value is FeaturedStudySource => {
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  return asText(source.label).length > 0 && /^https:\/\//.test(asText(source.href));
};

const asTextArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(asText).filter(Boolean) : [];

const isSection = (value: unknown): value is FeaturedStudySection => {
  if (!value || typeof value !== "object") return false;
  const section = value as Record<string, unknown>;
  return asText(section.title).length > 0 && asText(section.summary).length > 0;
};

const asSection = (value: unknown): FeaturedStudySection | null => {
  if (!isSection(value)) return null;
  const section = value as unknown as Record<string, unknown>;
  return {
    navLabel: asText(section.navLabel) || asText(section.title),
    title: asText(section.title),
    lessonRange: asText(section.lessonRange),
    reading: asText(section.reading),
    summary: asText(section.summary),
    keywords: asTextArray(section.keywords),
    context: asText(section.context),
    keyPoints: asTextArray(section.keyPoints),
    application: asText(section.application),
    questions: asTextArray(section.questions),
  };
};

/**
 * Converte a linha do Supabase (snake_case) no objeto do site.
 * Retorna null quando não há dados mínimos confiáveis.
 */
export function normalizeFeaturedStudy(row: unknown): FeaturedStudy | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const slug = asText(record.slug);
  const title = asText(record.title);
  if (!slug || !title) return null;

  const art480 = asText(record.art_480_url);
  const art900 = asText(record.art_900_url);
  let sections = (Array.isArray(record.sections) ? record.sections : [])
    .map(asSection)
    .filter((section): section is FeaturedStudySection => section !== null);
  if (!sections.length && slug === DEFAULT_FEATURED_STUDY.slug) {
    sections = DEFAULT_FEATURED_STUDY.sections;
  }

  return {
    slug,
    title,
    subtitle: asText(record.subtitle),
    intro: asText(record.intro),
    art480: art480 || art900 || DEFAULT_FEATURED_STUDY.art480,
    art900: art900 || art480 || DEFAULT_FEATURED_STUDY.art900,
    artAlt: asText(record.art_alt) || title,
    book: {
      title: asText(record.book_title),
      author: asText(record.book_author),
      href: asText(record.book_href) || undefined,
      linkLabel: asText(record.book_link_label) || undefined,
    },
    sources: (Array.isArray(record.sources) ? record.sources : []).filter(isSource),
    sections,
  };
}
