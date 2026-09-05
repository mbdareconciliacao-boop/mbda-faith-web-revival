import { contentSEO, messages, studies } from "./contentCatalog.ts";
import { SEO_CONFIG } from "../constants/index.ts";

export const publicPages = [
  { path: "/", seo: { ...SEO_CONFIG, path: "/" } },
  { path: "/mensagens", seo: contentSEO("Mensagens", "Assista às mensagens e celebrações da Reconciliação. Encontre também estudos em vídeo já selecionados no nosso acervo.", "/mensagens") },
  { path: "/estudos", seo: contentSEO("Estudos bíblicos", "Literatura em destaque aplicada: encontre o roteiro de Tessalonicenses por tema e acompanhe a leitura bíblica.", "/estudos") },
  { path: "/livros", seo: contentSEO("Livros recomendados", "As leituras recomendadas pela igreja, com capas, autores e links para encontrar livros em editoras e livrarias.", "/livros") },
  { path: "/igreja", seo: contentSEO("A igreja", "Conheça o Ministério Bíblico da Reconciliação em Guarujá: nossa história, declaração de fé e contato.", "/igreja") },
  { path: "/agenda", seo: contentSEO("Cultos e visita", "Domingos às 8h, 9h e 11h e quartas às 20h. Consulte os encontros da Reconciliação e como chegar em Guarujá.", "/agenda") },
  { path: "/noticias", seo: contentSEO("Notícias · ReconNews", "Notícias sobre fé, igreja e história, com fontes identificadas. Consulte o acervo ReconNews.", "/noticias") },
  { path: "/blog", seo: contentSEO("Tessalonicenses · Escola Bíblica da Reconciliação", "Guia de estudo autoral sobre 1 e 2 Tessalonicenses: contexto, palavras-chave, ideias centrais e aplicações para a igreja local.", "/blog", "/images/site/blog/tessalonicenses-evento-900.webp") },
  ...messages.map(item => ({ path: `/mensagens/${item.slug}`, seo: contentSEO(item.title, item.description, `/mensagens/${item.slug}`, item.image) })),
  ...studies.map(item => ({ path: item.href, seo: contentSEO(item.title, item.summary, item.href, "/images/site/blog/tessalonicenses-evento-900.webp") })),
];
