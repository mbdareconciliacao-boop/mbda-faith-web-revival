import { useEffect } from 'react';
import { SEOConfig } from '../types';
import { SITE_ORIGIN } from '../data/contentCatalog';

export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    // Título da página
    document.title = config.title;
    
    // Meta description
    const updateOrCreateMeta = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Meta tags básicas
    updateOrCreateMeta('description', config.description);
    updateOrCreateMeta('keywords', config.keywords);
    
    // Open Graph tags
    updateOrCreateMeta('og:title', config.ogTitle, 'property');
    updateOrCreateMeta('og:description', config.ogDescription, 'property');
    updateOrCreateMeta('og:type', 'website', 'property');
    const canonicalUrl = SITE_ORIGIN + (config.path ?? '/');
    updateOrCreateMeta('og:url', canonicalUrl, 'property');
    updateOrCreateMeta('og:image', new URL(config.image ?? '/images/site/logo-evergreen.webp', SITE_ORIGIN).href, 'property');
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    
  }, [config]);
};
