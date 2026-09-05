// Tipos globais do projeto
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  path?: string;
  image?: string;
}

// NavigationItem removido - não estava sendo usado

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

// ContactInfo removido - não estava sendo usado
