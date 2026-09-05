import { BAPTISM_EVENT } from "./church.ts";
import { thessaloniansStudy } from "./tessalonians.ts";
import { youtubeMessages } from "./youtubeMessages.ts";

export const SITE_ORIGIN = "https://mbdareconciliacao.vercel.app";

// Curadoria explícita. Não inferir pregador, duração ou conteúdo de uma mensagem.
export interface Message {
  slug: string; title: string; description: string;
  date: string | undefined; dateTime: string | undefined;
  image: string; imageAlt: string; youtubeId: string | undefined;
  video: string | undefined; source: string | undefined;
  topics: readonly string[]; relatedStudies: readonly string[];
}
const curatedMessages: Message[] = [
  {
    slug: "culto-especial-de-batismo",
    title: BAPTISM_EVENT.title,
    description: BAPTISM_EVENT.description,
    date: BAPTISM_EVENT.date,
    dateTime: BAPTISM_EVENT.dateTime,
    image: "/images/site/eventos/batismo-04-720.webp",
    imageAlt: "Igreja reunida em oração durante o culto especial de batismo",
    youtubeId: "lyla5Gl2oBI",
    video: undefined,
    source: BAPTISM_EVENT.youtube,
    topics: ["Batismo", "Vida em comunidade"],
    relatedStudies: [] as string[],
  },
  {
    slug: "a-obrigatoriedade-de-evangelizar",
    title: "A Obrigatoriedade de Evangelizar",
    description: "Um momento de reflexão bíblica para sua semana.",
    date: undefined,
    dateTime: undefined,
    image: "/images/site/hero-scene.webp",
    imageAlt: "",
    youtubeId: undefined,
    video: "/videos/devocional-evangelizar-540p.mp4",
    source: undefined,
    topics: ["Evangelização"],
    relatedStudies: ["tessalonica-e-a-missao"],
  },
];
export const messages: Message[] = [
  ...youtubeMessages.map(message => {
    const original = curatedMessages.find(item => item.youtubeId === message.youtubeId);
    return original ? { ...message, slug: original.slug } : message;
  }),
  ...curatedMessages.filter(item => !youtubeMessages.some(video => video.youtubeId === item.youtubeId)),
];

export const externalMessages = [
  { id: "u2R0dCZTFfM", title: "Livre-arbítrio", author: "Augustus Nicodemus" },
  { id: "KdfnoeaPMv0", title: "Panorama do Apocalipse", author: "Pr. Hernandes Dias Lopes" },
  { id: "_xEjtLTdcuQ", title: "As Reformas Evangélicas", author: "Luiz Sayão" },
] as const;

// URLs estáveis, independentes de futuras correções nos títulos.
export const studySlugs = [
  "tessalonica-e-a-missao", "uma-igreja-modelo", "lideranca-que-cuida",
  "santidade-cotidiana", "trabalho-e-testemunho", "a-volta-de-cristo",
  "harmonia-e-discernimento", "permanecer-firmes",
] as const;

export const studies = thessaloniansStudy.map((section, index) => ({
  ...section,
  slug: studySlugs[index],
  href: `/estudos/tessalonicenses/${studySlugs[index]}`,
  // Estimativa determinística, baseada apenas no texto já existente.
  readingMinutes: Math.max(1, Math.ceil([
    section.summary, section.context, ...section.keyPoints,
    section.application, ...section.questions,
  ].join(" ").split(/\s+/).length / 180)),
}));

export const legacyDestinations: Record<string, string> = {
  "#quem-somos": "/igreja#quem-somos", "#declaracao-de-fe": "/igreja#declaracao-de-fe",
  "#espaco-familia": "/igreja#espaco-familia", "#contato": "/igreja#contato",
  "#midia": "/igreja#midia",
  "#agenda": "/agenda", "#reconnews": "/noticias",
  "#estudos-biblicos": "/mensagens", "#devocional": "/mensagens/a-obrigatoriedade-de-evangelizar",
};

export function matchesSearch(query: string, ...fields: string[]): boolean {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const terms = normalize(query.slice(0, 120)).trim().split(/\s+/).filter(Boolean);
  const text = normalize(fields.join(" "));
  return terms.every(term => text.includes(term));
}

export function contentSEO(title: string, description: string, path: string, image?: string) {
  return {
    title: `${title} · Reconciliação`, description,
    keywords: "Reconciliação, igreja, estudo bíblico, mensagens, livros, Guarujá",
    ogTitle: title, ogDescription: description, path,
    image: image ?? "/images/site/logo-evergreen.webp",
  };
}
