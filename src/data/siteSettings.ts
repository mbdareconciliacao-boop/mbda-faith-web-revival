import { MONTHLY_GATHERINGS, WEEKLY_SCHEDULE } from "./church";
import { declarations } from "./doctrine";
import { recommendedBooks } from "./recommendedBooks";
import { editorialUrl, editorialSrcSet } from "../domain/editorialSafety";

export interface SiteTheme {
  ink: string; navy: string; cobalt: string; blue: string; gold: string;
  paper: string; paperDeep: string; paperDeepHover: string; white: string;
  muted: string; line: string; navyLine: string; navyControl: string;
  navyMenuLine: string; catalogLine: string; sourceSurface: string; sourceLine: string;
  displayFont: string; condensedFont: string; bodyFont: string;
  backgroundImage: string;
}

export interface SitePath { kicker: string; label: string; href: string; }
export interface ScheduleItem { day: string; short: string; time: string; title: string; format: string; }
export interface MonthlyItem { cadence: string; shortCadence: string; title: string; }
export interface SiteBook {
  slug: string; title: string; author: string; description: string;
  image: string; imageSrcSet?: string; href?: string; linkLabel?: string; purchaseNote?: string;
}
export interface FeaturedVideo { youtubeId: string; title: string; description: string; date: string; }

export interface SiteContent {
  brand: { name: string; logo: string };
  home: {
    heroLines: string[]; heroSubtitle: string; heroButton: string;
    signatureTitle: string; signatureNote: string; paths: SitePath[];
    weeklyTitle: string; literatureNote: string; literatureAction: string;
    communityTitleLines: string[]; communityLead: string; eventsTitle: string; eventsLead: string;
  };
  agenda: { weekly: ScheduleItem[]; monthly: MonthlyItem[]; heading: string; lead: string; posterQuote: string; posterCite: string };
  church: {
    aboutTitleLines: string[]; aboutParagraphs: string[]; historyNote: string;
    faithTitleLines: string[]; faithLead: string;
    familyTitleLines: string[]; familyParagraphs: string[];
    declarations: Array<{ id: string; title: string; content: string }>;
  };
  books: SiteBook[];
  featuredVideo: FeaturedVideo | null;
  contact: {
    address: string; neighborhood: string; city: string; phone: string;
    whatsapp: string; instagram: string; facebook: string; youtube: string;
  };
  footer: { aboutLines: string[]; copyright: string; privacy: string };
}

export interface SiteSettings { theme: SiteTheme; content: SiteContent; }
export interface ThemeColorField { key: keyof SiteTheme; label: string; }

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  theme: {
    ink: "#020817", navy: "#06132c", cobalt: "#075be8", blue: "#0744b9",
    gold: "#f3b51b", paper: "#f5f1e8", paperDeep: "#e9e3d8",
    paperDeepHover: "#e2dbcf", white: "#fffefa", muted: "#536078",
    line: "#d9d8d0", navyLine: "#324867", navyControl: "#485672",
    navyMenuLine: "#35425e", catalogLine: "#243b61",
    sourceSurface: "#e8edf5", sourceLine: "#9daec7",
    displayFont: "Anton", condensedFont: "Barlow Condensed", bodyFont: "system",
    backgroundImage: "",
  },
  content: {
    brand: { name: "Reconciliação", logo: "/images/site/logo-evergreen.webp" },
    home: {
      heroLines: ["A fé nos reúne.", "A Palavra", "nos acompanha."],
      heroSubtitle: "Mensagens para ouvir, estudos para aprofundar e uma comunidade para caminhar junto.",
      heroButton: "Explore as mensagens",
      signatureTitle: "Ministério Bíblico da Reconciliação",
      signatureNote: "Há mais de 23 anos, em Guarujá.",
      paths: [
        { kicker: "Quero assistir", label: "Mensagens", href: "/mensagens" },
        { kicker: "Quero aprofundar", label: "Estudos bíblicos", href: "/estudos" },
        { kicker: "Quero ler", label: "Livros recomendados", href: "/livros" },
      ],
      weeklyTitle: "A semana na Reconciliação",
      literatureNote: "Leitura bíblica, contexto e aplicação para a vida da igreja.",
      literatureAction: "Acompanhar o estudo",
      communityTitleLines: ["A vida acontece", "em comunidade."],
      communityLead: "Encontros que fortalecem os vínculos, renovam a fé e fazem parte da nossa história.",
      eventsTitle: "Eventos da Reconciliação",
      eventsLead: "Uma seleção de registros reais dos encontros da nossa igreja. Celebrações, comunhão e momentos que fazem parte da nossa história.",
    },
    agenda: {
      weekly: WEEKLY_SCHEDULE.map((item) => ({ ...item })),
      monthly: MONTHLY_GATHERINGS.map((item) => ({ ...item })),
      heading: "Agenda semanal",
      lead: "Oração, ensino e comunhão ao longo da semana. Horários locais de Guarujá, São Paulo.",
      posterQuote: "“Porque pela graça sois salvos, por meio da fé.”",
      posterCite: "Efésios 2:8",
    },
    church: {
      aboutTitleLines: ["Uma igreja.", "Uma família.", "Uma só fé."],
      aboutParagraphs: [
        "Somos o Ministério Bíblico da Reconciliação, uma comunidade cristã dedicada ao amor, à fé e à transformação espiritual. Nosso ministério é um espaço de encontro, reflexão e crescimento para famílias e para todos que desejam se aproximar de Deus.",
        "Nossa missão é proclamar a mensagem de Cristo, promovendo reconciliação com Deus e com o próximo. Buscamos viver princípios bíblicos de forma prática, com ensino fiel da Palavra e serviço à comunidade.",
      ],
      historyNote: "23+ anos de ministério. Uma história compartilhada com mais de 500 famílias, em Guarujá.",
      faithTitleLines: ["A Palavra é", "nosso fundamento."],
      faithLead: "Nossa declaração de fé reúne os princípios doutrinários que orientam o ministério. Leia cada ponto na íntegra.",
      declarations: declarations.map((item) => ({ id: String(item.id), title: item.title, content: item.content })),
      familyTitleLines: ["Crescer na fé.", "Caminhar juntos."],
      familyParagraphs: [
        "Valorizamos as famílias e celebramos cada momento de cuidado, discipulado e convivência cristã.",
        "O Espaço Família é parte da nossa vida em comunidade. Conheça os encontros e converse conosco para participar.",
      ],
    },
    books: recommendedBooks.map((book) => ({
      slug: book.slug, title: book.title, author: book.author, description: book.description,
      image: book.image, imageSrcSet: book.imageSrcSet, href: book.href, linkLabel: book.linkLabel,
      purchaseNote: book.purchaseNote,
    })),
    featuredVideo: null,
    contact: {
      address: "Av. Osvaldo Aranha, 790",
      neighborhood: "Jardim Maravilha (Vicente de Carvalho)",
      city: "Guarujá/SP · CEP 11470-100",
      phone: "+55 (13) 98151-7913",
      whatsapp: "https://wa.me/5513981517913",
      instagram: "https://www.instagram.com/mbdareconciliacao/",
      facebook: "https://www.facebook.com/reconciliacaoguaruja",
      youtube: "https://www.youtube.com/@mbdareconciliacao",
    },
    footer: {
      aboutLines: ["Ensino da Palavra, comunhão familiar", "e edificação espiritual."],
      copyright: "Ministério Bíblico da Reconciliação",
      privacy: "Este site não carrega ferramentas de publicidade ou análise de visitas. As fotos da igreja são servidas pelo próprio site. Miniaturas de estudos vêm do YouTube; o player só abre ao solicitar a reprodução. O envio do formulário utiliza o EmailJS. WhatsApp, mapas e redes sociais abrem serviços externos sujeitos às suas próprias políticas. Não inclua informações sensíveis no formulário.",
    },
  },
};

export const THEME_COLOR_FIELDS: ThemeColorField[] = [
  { key: "blue", label: "Azul principal" },
  { key: "cobalt", label: "Azul brilhante" },
  { key: "gold", label: "Dourado" },
  { key: "navy", label: "Azul escuro (fundo)" },
  { key: "ink", label: "Tinta (texto escuro)" },
  { key: "paper", label: "Papel (fundo claro)" },
  { key: "paperDeep", label: "Papel escuro" },
  { key: "paperDeepHover", label: "Papel escuro (hover)" },
  { key: "white", label: "Branco" },
  { key: "muted", label: "Texto secundário" },
  { key: "line", label: "Linha clara" },
  { key: "navyLine", label: "Linha escura" },
  { key: "navyControl", label: "Controle escuro" },
  { key: "navyMenuLine", label: "Linha do menu" },
  { key: "catalogLine", label: "Linha do catálogo" },
  { key: "sourceSurface", label: "Superfície de fonte" },
  { key: "sourceLine", label: "Linha de fonte" },
];

export const FONT_OPTIONS: Record<"display" | "condensed" | "body", string[]> = {
  display: ["Anton", "Oswald", "Bebas Neue"],
  condensed: ["Barlow Condensed", "Oswald"],
  body: ["system", "Inter", "Roboto", "Lora"],
};

const FONT_STACKS: Record<"display" | "condensed" | "body", Record<string, string>> = {
  display: { Anton: '"Anton", sans-serif', Oswald: '"Oswald", sans-serif', "Bebas Neue": '"Bebas Neue", sans-serif' },
  condensed: { "Barlow Condensed": '"Barlow Condensed", sans-serif', Oswald: '"Oswald", sans-serif' },
  body: {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    Inter: '"Inter", sans-serif', Roboto: '"Roboto", sans-serif', Lora: '"Lora", serif',
  },
};

const COLOR_VARS: Partial<Record<keyof SiteTheme, string>> = {
  ink: "--ink", navy: "--navy", cobalt: "--cobalt", blue: "--blue", gold: "--gold",
  paper: "--paper", paperDeep: "--paper-deep", paperDeepHover: "--paper-deep-hover",
  white: "--white", muted: "--muted", line: "--line", navyLine: "--navy-line",
  navyControl: "--navy-control", navyMenuLine: "--navy-menu-line",
  catalogLine: "--catalog-line", sourceSurface: "--source-surface", sourceLine: "--source-line",
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const asHex = (value: unknown, fallback: string): string =>
  typeof value === "string" && HEX.test(value.trim()) ? value.trim().toLowerCase() : fallback;
const asFont = (value: unknown, category: "display" | "condensed" | "body", fallback: string): string => {
  const text = typeof value === "string" ? value.trim() : "";
  return FONT_OPTIONS[category].includes(text) ? text : fallback;
};
const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;
const asStringList = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const list = value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
  return list.length ? list : fallback;
};
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asSchedule = (value: unknown, fallback: ScheduleItem[]): ScheduleItem[] => {
  if (!Array.isArray(value)) return fallback;
  const list = value.filter((item) => !!item && typeof item === "object").map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      day: asString(entry.day, ""), short: asString(entry.short, ""),
      time: asString(entry.time, ""), title: asString(entry.title, ""),
      format: asString(entry.format, "Presencial"),
    };
  }).filter((item) => item.time && item.title);
  return list.length ? list : fallback;
};

const asMonthly = (value: unknown, fallback: MonthlyItem[]): MonthlyItem[] => {
  if (!Array.isArray(value)) return fallback;
  const list = value.filter((item) => !!item && typeof item === "object").map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      cadence: asString(entry.cadence, ""), shortCadence: asString(entry.shortCadence, ""),
      title: asString(entry.title, ""),
    };
  }).filter((item) => item.title);
  return list.length ? list : fallback;
};

const asBooks = (value: unknown, fallback: SiteBook[]): SiteBook[] => {
  if (!Array.isArray(value)) return fallback;
  const list = value.filter((item) => !!item && typeof item === "object").map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      slug: asString(entry.slug, ""),
      title: asString(entry.title, ""),
      author: asString(entry.author, ""),
      description: asString(entry.description, ""),
      image: editorialUrl(entry.image, true) ?? "/images/site/logo-evergreen.webp",
      imageSrcSet: editorialSrcSet(entry.imageSrcSet),
      href: editorialUrl(entry.href),
      linkLabel: typeof entry.linkLabel === "string" && entry.linkLabel ? entry.linkLabel : undefined,
      purchaseNote: typeof entry.purchaseNote === "string" && entry.purchaseNote ? entry.purchaseNote : undefined,
    };
  }).filter((item) => item.title && item.slug);
  return list.length ? list : fallback;
};

const asDeclarations = (value: unknown): Array<{ id: string; title: string; content: string }> => {
  const fallback = DEFAULT_SITE_SETTINGS.content.church.declarations;
  if (!Array.isArray(value)) return fallback;
  const list = value.filter((item) => !!item && typeof item === "object").map((item) => {
    const entry = item as Record<string, unknown>;
    return { id: asString(entry.id, ""), title: asString(entry.title, ""), content: asString(entry.content, "") };
  }).filter((item) => item.title && item.content);
  return list.length ? list : fallback;
};

const asFeaturedVideo = (value: unknown): FeaturedVideo | null => {
  const entry = record(value);
  const youtubeId = asString(entry.youtubeId, "");
  if (!YOUTUBE_ID.test(youtubeId)) return null;
  return {
    youtubeId,
    title: asString(entry.title, "Mensagem em destaque"),
    description: asString(entry.description, ""),
    date: asString(entry.date, ""),
  };
};

const asContent = (value: unknown): SiteContent => {
  const root = record(value);
  const base = DEFAULT_SITE_SETTINGS.content;
  const home = record(root.home);
  const agenda = record(root.agenda);
  const church = record(root.church);
  const contact = record(root.contact);
  const footer = record(root.footer);
  const brand = record(root.brand);
  const paths = Array.isArray(home.paths)
    ? home.paths.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item, index) => ({
        kicker: asString(item.kicker, base.home.paths[index]?.kicker ?? ""),
        label: asString(item.label, base.home.paths[index]?.label ?? ""),
        href: editorialUrl(item.href, true) ?? base.home.paths[index]?.href ?? "/",
      }))
    : base.home.paths;
  return {
    brand: { name: asString(brand.name, base.brand.name), logo: editorialUrl(brand.logo, true) ?? base.brand.logo },
    home: {
      heroLines: asStringList(home.heroLines, base.home.heroLines),
      heroSubtitle: asString(home.heroSubtitle, base.home.heroSubtitle),
      heroButton: asString(home.heroButton, base.home.heroButton),
      signatureTitle: asString(home.signatureTitle, base.home.signatureTitle),
      signatureNote: asString(home.signatureNote, base.home.signatureNote),
      paths: paths.length ? paths : base.home.paths,
      weeklyTitle: asString(home.weeklyTitle, base.home.weeklyTitle),
      literatureNote: asString(home.literatureNote, base.home.literatureNote),
      literatureAction: asString(home.literatureAction, base.home.literatureAction),
      communityTitleLines: asStringList(home.communityTitleLines, base.home.communityTitleLines),
      communityLead: asString(home.communityLead, base.home.communityLead),
      eventsTitle: asString(home.eventsTitle, base.home.eventsTitle),
      eventsLead: asString(home.eventsLead, base.home.eventsLead),
    },
    agenda: {
      weekly: asSchedule(agenda.weekly, base.agenda.weekly),
      monthly: asMonthly(agenda.monthly, base.agenda.monthly),
      heading: asString(agenda.heading, base.agenda.heading),
      lead: asString(agenda.lead, base.agenda.lead),
      posterQuote: asString(agenda.posterQuote, base.agenda.posterQuote),
      posterCite: asString(agenda.posterCite, base.agenda.posterCite),
    },
    church: {
      aboutTitleLines: asStringList(church.aboutTitleLines, base.church.aboutTitleLines),
      aboutParagraphs: asStringList(church.aboutParagraphs, base.church.aboutParagraphs),
      historyNote: asString(church.historyNote, base.church.historyNote),
      declarations: asDeclarations(church.declarations),
      faithTitleLines: asStringList(church.faithTitleLines, base.church.faithTitleLines),
      faithLead: asString(church.faithLead, base.church.faithLead),
      familyTitleLines: asStringList(church.familyTitleLines, base.church.familyTitleLines),
      familyParagraphs: asStringList(church.familyParagraphs, base.church.familyParagraphs),
    },
    books: asBooks(root.books, base.books),
    featuredVideo: asFeaturedVideo(root.featuredVideo),
    contact: {
      address: asString(contact.address, base.contact.address),
      neighborhood: asString(contact.neighborhood, base.contact.neighborhood),
      city: asString(contact.city, base.contact.city),
      phone: asString(contact.phone, base.contact.phone),
      whatsapp: editorialUrl(contact.whatsapp) ?? base.contact.whatsapp,
      instagram: editorialUrl(contact.instagram) ?? base.contact.instagram,
      facebook: editorialUrl(contact.facebook) ?? base.contact.facebook,
      youtube: editorialUrl(contact.youtube) ?? base.contact.youtube,
    },
    footer: {
      aboutLines: asStringList(footer.aboutLines, base.footer.aboutLines),
      copyright: asString(footer.copyright, base.footer.copyright),
      privacy: asString(footer.privacy, base.footer.privacy),
    },
  };
};

export function normalizeSiteSettings(row: unknown): SiteSettings {
  const root = record(row);
  const theme = record(root.theme);
  const base = DEFAULT_SITE_SETTINGS.theme;
  const colors = Object.fromEntries(
    (Object.keys(COLOR_VARS) as Array<keyof SiteTheme>).map((key) => [key, asHex(theme[key], base[key] as string)]),
  );
  return {
    theme: {
      ...base, ...colors,
      displayFont: asFont(theme.displayFont, "display", base.displayFont),
      condensedFont: asFont(theme.condensedFont, "condensed", base.condensedFont),
      bodyFont: asFont(theme.bodyFont, "body", base.bodyFont),
      backgroundImage: editorialUrl(theme.backgroundImage, true) ?? "",
    } as SiteTheme,
    content: asContent(root.content),
  };
}

export function applyTheme(theme: SiteTheme, root: HTMLElement = document.documentElement): void {
  (Object.entries(COLOR_VARS) as Array<[keyof SiteTheme, string]>).forEach(([key, cssVar]) => {
    const value = theme[key];
    if (typeof value === "string") root.style.setProperty(cssVar, value);
  });
  root.style.setProperty("--display", FONT_STACKS.display[theme.displayFont] ?? FONT_STACKS.display.Anton);
  root.style.setProperty("--condensed", FONT_STACKS.condensed[theme.condensedFont] ?? FONT_STACKS.condensed["Barlow Condensed"]);
  root.style.setProperty("--body", FONT_STACKS.body[theme.bodyFont] ?? FONT_STACKS.body.system);
  const background = editorialUrl(theme.backgroundImage, true) ?? "";
  root.style.setProperty("--site-background-image", background ? `url("${background}")` : "none");
}


export type SiteEntity = "tema" | "textos" | "agenda" | "igreja" | "livros";
export const SITE_ENTITIES: SiteEntity[] = ["tema", "textos", "agenda", "igreja", "livros"];

/** Extrai a fatia de conteúdo de uma entidade para salvar/publicar. */
export function entityContent(entity: SiteEntity, settings: SiteSettings): Record<string, unknown> {
  switch (entity) {
    case "tema":
      return { ...settings.theme };
    case "textos":
      return {
        brand: settings.content.brand,
        home: settings.content.home,
        contact: settings.content.contact,
        footer: settings.content.footer,
        featuredVideo: settings.content.featuredVideo,
      };
    case "agenda":
      return { agenda: settings.content.agenda };
    case "igreja":
      return { church: settings.content.church };
    case "livros":
      return { books: settings.content.books };
  }
}

/** Junta as linhas de entidades (rascunho ou publicado) em um SiteSettings. */
export function mergeEntityRows(rows: Array<{ entity: string; content: unknown }>): SiteSettings {
  const byEntity = new Map<string, unknown>();
  for (const row of rows) byEntity.set(row.entity, row.content);
  const textos = record(byEntity.get("textos"));
  const agenda = record(byEntity.get("agenda"));
  const igreja = record(byEntity.get("igreja"));
  const livros = record(byEntity.get("livros"));
  return normalizeSiteSettings({
    theme: byEntity.get("tema"),
    content: {
      brand: textos.brand,
      home: textos.home,
      contact: textos.contact,
      footer: textos.footer,
      featuredVideo: textos.featuredVideo ?? null,
      agenda: agenda.agenda,
      church: igreja.church,
      books: livros.books,
    },
  });
}
