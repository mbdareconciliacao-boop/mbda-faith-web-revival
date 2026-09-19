export interface SiteTheme {
  ink: string;
  navy: string;
  cobalt: string;
  blue: string;
  gold: string;
  paper: string;
  paperDeep: string;
  paperDeepHover: string;
  white: string;
  muted: string;
  line: string;
  navyLine: string;
  navyControl: string;
  navyMenuLine: string;
  catalogLine: string;
  sourceSurface: string;
  sourceLine: string;
  displayFont: string;
  condensedFont: string;
  bodyFont: string;
}

export interface SitePath {
  kicker: string;
  label: string;
  href: string;
}

export interface SiteContent {
  brand: { name: string; logo: string };
  home: {
    heroLines: string[];
    heroSubtitle: string;
    heroButton: string;
    signatureTitle: string;
    signatureNote: string;
    paths: SitePath[];
    weeklyTitle: string;
    literatureNote: string;
    literatureAction: string;
    communityTitleLines: string[];
    communityLead: string;
    eventsTitle: string;
    eventsLead: string;
  };
  contact: {
    address: string;
    neighborhood: string;
    city: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  footer: {
    aboutLines: string[];
    copyright: string;
    privacy: string;
  };
}

export interface SiteSettings {
  theme: SiteTheme;
  content: SiteContent;
}

export interface ThemeColorField {
  key: keyof SiteTheme;
  label: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  theme: {
    ink: "#020817",
    navy: "#06132c",
    cobalt: "#075be8",
    blue: "#0744b9",
    gold: "#f3b51b",
    paper: "#f5f1e8",
    paperDeep: "#e9e3d8",
    paperDeepHover: "#e2dbcf",
    white: "#fffefa",
    muted: "#536078",
    line: "#d9d8d0",
    navyLine: "#324867",
    navyControl: "#485672",
    navyMenuLine: "#35425e",
    catalogLine: "#243b61",
    sourceSurface: "#e8edf5",
    sourceLine: "#9daec7",
    displayFont: "Anton",
    condensedFont: "Barlow Condensed",
    bodyFont: "system",
  },
  content: {
    brand: { name: "Reconciliação", logo: "/images/site/logo-evergreen.webp" },
    home: {
      heroLines: ["A fé nos reúne.", "A Palavra", "nos acompanha."],
      heroSubtitle:
        "Mensagens para ouvir, estudos para aprofundar e uma comunidade para caminhar junto.",
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
      communityLead:
        "Encontros que fortalecem os vínculos, renovam a fé e fazem parte da nossa história.",
      eventsTitle: "Eventos da Reconciliação",
      eventsLead:
        "Uma seleção de registros reais dos encontros da nossa igreja. Celebrações, comunhão e momentos que fazem parte da nossa história.",
    },
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
      privacy:
        "Este site não carrega ferramentas de publicidade ou análise de visitas. As fotos da igreja são servidas pelo próprio site. Miniaturas de estudos vêm do YouTube; o player só abre ao solicitar a reprodução. O envio do formulário utiliza o EmailJS. WhatsApp, mapas e redes sociais abrem serviços externos sujeitos às suas próprias políticas. Não inclua informações sensíveis no formulário.",
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
  display: {
    Anton: '"Anton", sans-serif',
    Oswald: '"Oswald", sans-serif',
    "Bebas Neue": '"Bebas Neue", sans-serif',
  },
  condensed: {
    "Barlow Condensed": '"Barlow Condensed", sans-serif',
    Oswald: '"Oswald", sans-serif',
  },
  body: {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    Inter: '"Inter", sans-serif',
    Roboto: '"Roboto", sans-serif',
    Lora: '"Lora", serif',
  },
};

const COLOR_VARS: Partial<Record<keyof SiteTheme, string>> = {
  ink: "--ink",
  navy: "--navy",
  cobalt: "--cobalt",
  blue: "--blue",
  gold: "--gold",
  paper: "--paper",
  paperDeep: "--paper-deep",
  paperDeepHover: "--paper-deep-hover",
  white: "--white",
  muted: "--muted",
  line: "--line",
  navyLine: "--navy-line",
  navyControl: "--navy-control",
  navyMenuLine: "--navy-menu-line",
  catalogLine: "--catalog-line",
  sourceSurface: "--source-surface",
  sourceLine: "--source-line",
};

const HEX = /^#[0-9a-fA-F]{6}$/;
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
const asContent = (value: unknown): SiteContent => {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const home = record.home && typeof record.home === "object" ? (record.home as Record<string, unknown>) : {};
  const contact = record.contact && typeof record.contact === "object" ? (record.contact as Record<string, unknown>) : {};
  const footer = record.footer && typeof record.footer === "object" ? (record.footer as Record<string, unknown>) : {};
  const brand = record.brand && typeof record.brand === "object" ? (record.brand as Record<string, unknown>) : {};
  const base = DEFAULT_SITE_SETTINGS.content;
  const paths = Array.isArray(home.paths)
    ? home.paths.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item, index) => ({
        kicker: asString(item.kicker, base.home.paths[index]?.kicker ?? ""),
        label: asString(item.label, base.home.paths[index]?.label ?? ""),
        href: asString(item.href, base.home.paths[index]?.href ?? "/"),
      }))
    : base.home.paths;
  return {
    brand: {
      name: asString(brand.name, base.brand.name),
      logo: asString(brand.logo, base.brand.logo),
    },
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
    contact: {
      address: asString(contact.address, base.contact.address),
      neighborhood: asString(contact.neighborhood, base.contact.neighborhood),
      city: asString(contact.city, base.contact.city),
      phone: asString(contact.phone, base.contact.phone),
      whatsapp: asString(contact.whatsapp, base.contact.whatsapp),
      instagram: asString(contact.instagram, base.contact.instagram),
      facebook: asString(contact.facebook, base.contact.facebook),
      youtube: asString(contact.youtube, base.contact.youtube),
    },
    footer: {
      aboutLines: asStringList(footer.aboutLines, base.footer.aboutLines),
      copyright: asString(footer.copyright, base.footer.copyright),
      privacy: asString(footer.privacy, base.footer.privacy),
    },
  };
};

export function normalizeSiteSettings(row: unknown): SiteSettings {
  const record = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const theme = record.theme && typeof record.theme === "object" ? (record.theme as Record<string, unknown>) : {};
  const base = DEFAULT_SITE_SETTINGS.theme;
  const colors = Object.fromEntries(
    (Object.keys(COLOR_VARS) as Array<keyof SiteTheme>).map((key) => [
      key,
      asHex(theme[key], base[key] as string),
    ]),
  );
  return {
    theme: {
      ...base,
      ...colors,
      displayFont: asFont(theme.displayFont, "display", base.displayFont),
      condensedFont: asFont(theme.condensedFont, "condensed", base.condensedFont),
      bodyFont: asFont(theme.bodyFont, "body", base.bodyFont),
    } as SiteTheme,
    content: asContent(record.content),
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
}
