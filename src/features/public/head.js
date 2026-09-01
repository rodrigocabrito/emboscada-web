// Imperative <head> helpers for the public site's per-route SEO metadata.
// Dependency-free (no react-helmet): the marketing site is small and the
// title/description/OG/JSON-LD tags are simple to upsert by hand from the
// route-change effect in PublicLayout.

// Upsert a <meta> tag matched by a single identifying attribute (name/property).
const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

export const setDescription = (text) => setMeta('name', 'description', text);

export const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

// Open Graph (Facebook / WhatsApp / LinkedIn) + Twitter card tags — these drive
// the preview card shown when a page URL is shared.
export const setSocialTags = ({ title, description, url, image, locale, siteName }) => {
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:locale', locale);
  setMeta('property', 'og:site_name', siteName);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);
};

// hreflang alternate links (#9) — tells search engines which URL serves each
// language for the current page. Replaces the previously-managed set each call.
export const setAlternates = (alternates) => {
  document.head.querySelectorAll('link[rel="alternate"][data-i18n="1"]').forEach((el) => el.remove());
  alternates.forEach(({ hreflang, href }) => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    el.setAttribute('href', href);
    el.setAttribute('data-i18n', '1');
    document.head.appendChild(el);
  });
};

// JSON-LD structured data, upserted by id so a block can be swapped or removed
// as the route changes (pass null data to remove it).
export const setJsonLd = (id, data) => {
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};
