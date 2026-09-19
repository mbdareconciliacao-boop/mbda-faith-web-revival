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

export interface SiteSettings {
  theme: SiteTheme;
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
};

/** Chaves de cor editáveis, na ordem em que aparecem no painel. */
export const THEME_COLOR_FIELDS: Array<{ key: keyof SiteTheme; label: string }> = [
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

const asFont = (
  value: unknown,
  category: "display" | "condensed" | "body",
  fallback: string,
): string => {
  const text = typeof value === "string" ? value.trim() : "";
  return FONT_OPTIONS[category].includes(text) ? text : fallback;
};

/** Une o que veio do Supabase com os padrões, ignorando valores inválidos. */
export function normalizeSiteSettings(row: unknown): SiteSettings {
  const record = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const theme = record.theme && typeof record.theme === "object"
    ? (record.theme as Record<string, unknown>)
    : {};
  const base = DEFAULT_SITE_SETTINGS.theme;
  const colors = Object.fromEntries(
    Object.entries(COLOR_VARS).map(([key, cssVar]) => [
      cssVar,
      asHex(theme[key], base[key as keyof SiteTheme] as string),
    ]),
  );
  return {
    theme: {
      ...base,
      ...Object.fromEntries(
        (Object.keys(COLOR_VARS) as Array<keyof SiteTheme>).map((key) => [
          key,
          asHex(theme[key], base[key] as string),
        ]),
      ),
      displayFont: asFont(theme.displayFont, "display", base.displayFont),
      condensedFont: asFont(theme.condensedFont, "condensed", base.condensedFont),
      bodyFont: asFont(theme.bodyFont, "body", base.bodyFont),
    } as SiteTheme,
  };
}

/** Converte o tema em variáveis CSS do documento. */
export function applyTheme(theme: SiteTheme, root: HTMLElement = document.documentElement): void {
  (Object.entries(COLOR_VARS) as Array<[keyof SiteTheme, string]>).forEach(([key, cssVar]) => {
    const value = theme[key];
    if (typeof value === "string") root.style.setProperty(cssVar, value);
  });
  root.style.setProperty(
    "--display",
    FONT_STACKS.display[theme.displayFont] ?? FONT_STACKS.display.Anton,
  );
  root.style.setProperty(
    "--condensed",
    FONT_STACKS.condensed[theme.condensedFont] ?? FONT_STACKS.condensed["Barlow Condensed"],
  );
  root.style.setProperty("--body", FONT_STACKS.body[theme.bodyFont] ?? FONT_STACKS.body.system);
}
