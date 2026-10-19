/**
 * I3DION Spatial Hub — Client-Side Dynamic SEO & Social Meta Manager (HUB-13)
 * Dynamically injects and synchronizes OpenGraph, Twitter Cards, canonical links,
 * and JSON-LD structured metadata as users navigate through Hub routes.
 */

export interface SeoMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'profile' | 'article';
  schemaOrg?: Record<string, unknown>;
}

export function updateSeoMeta(options: SeoMetaOptions): void {
  if (typeof document === 'undefined') return;

  const defaultTitle = 'I3DION Spatial Hub | Industrial 3D & AR Showroom';
  const defaultDesc =
    'Explore verified industrial-grade 3D equipment models, CAD specifications, interactive WebXR, and real-time quotation baskets.';
  const defaultImage = `${window.location.origin}/og-spatial-hub.png`;
  const currentUrl = options.url || window.location.href;

  const fullTitle = options.title ? `${options.title} | I3DION Spatial Hub` : defaultTitle;
  const description = options.description || defaultDesc;
  const image = options.image || defaultImage;
  const type = options.type || 'website';

  // 1. Title
  document.title = fullTitle;

  // 2. Helper to set or create meta tag
  const setMeta = (attributeName: 'name' | 'property', attributeValue: string, content: string) => {
    let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 3. Standard & Description
  setMeta('name', 'description', description);

  // 4. OpenGraph
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', currentUrl);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:site_name', 'I3DION Spatial Hub');

  // 5. Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  // 6. Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', currentUrl);

  // 7. Schema.org JSON-LD
  if (options.schemaOrg) {
    const scriptId = 'i3dion-jsonld-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(options.schemaOrg);
  }
}
