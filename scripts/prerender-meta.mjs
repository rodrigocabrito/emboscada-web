// Post-build step (#10): write one static HTML shell per public route × language
// with title/description/canonical/Open-Graph/hreflang baked into the initial
// <head>. Social scrapers (WhatsApp/Facebook/Twitter) and crawlers don't run JS,
// so without this they'd see only the generic index.html meta. The body still
// hydrates client-side from the same bundle — this only enriches the served HTML.
//
// Runs after `vite build` (see package.json). Set SITE_URL to the production
// origin so absolute URLs are correct; defaults to the brand domain.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageTitles, pageMeta, localizePath, site } from '../src/features/public/content.js';

const SITE_URL = (process.env.SITE_URL || 'https://emboscada-web.vercel.app').replace(/\/$/, '');
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const LANGS = ['pt', 'en', 'fr', 'es'];
const OG_LOCALE = { pt: 'pt_PT', en: 'en_GB', fr: 'fr_FR', es: 'es_ES' };

// Mirrors the nav/title translations in i18n.jsx (only the keys used as page
// titles). Proper nouns like "Porto"/"Monsanto" fall through untranslated.
const TITLE_I18N = {
  'Adultos': { en: 'Adults', fr: 'Adultes', es: 'Adultos' },
  'Crianças': { en: 'Kids', fr: 'Enfants', es: 'Niños' },
  'Empresas': { en: 'Companies', fr: 'Entreprises', es: 'Empresas' },
  'Campos': { en: 'Parks', fr: 'Parcs', es: 'Campos' },
  'Contactos': { en: 'Contact', fr: 'Contact', es: 'Contacto' },
  'Reservas': { en: 'Booking', fr: 'Réservation', es: 'Reservas' },
  'Perguntas Frequentes': { en: 'FAQs', fr: 'FAQ', es: 'Preguntas frecuentes' },
  'Política de Privacidade': { en: 'Privacy Policy', fr: 'Politique de confidentialité', es: 'Política de privacidad' },
};
const tr = (str, lang) => (lang === 'pt' || !str ? str : (TITLE_I18N[str]?.[lang] || str));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
let count = 0;

for (const cpath of Object.keys(pageTitles)) {
  const key = pageTitles[cpath];
  const description = pageMeta[cpath] || pageMeta['/'];
  const image = `${SITE_URL}/site/hero-1.jpg`;

  for (const lang of LANGS) {
    const title = key ? `${tr(key, lang)} · ${site.name}` : site.name;
    const routePath = localizePath(cpath, lang);
    const url = SITE_URL + routePath;

    const headTags = [
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:image" content="${image}" />`,
      `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
      `<meta property="og:site_name" content="${esc(site.name)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
      `<meta name="twitter:image" content="${image}" />`,
      ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${localizePath(cpath, l)}" data-i18n="1" />`),
      `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizePath(cpath, 'pt')}" data-i18n="1" />`,
    ].join('\n    ');

    const html = template
      .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
      .replace('</head>', `    ${headTags}\n  </head>`);

    const outFile = routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}/index.html`;
    const outPath = join(DIST, outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    count += 1;
  }
}

// Sitemap with hreflang alternates — one <url> per canonical page, each listing
// every language variant. Generated here so it can't drift from the routes above.
const priorityFor = (p) => (p === '/' ? '1.0' : p === '/privacy' ? '0.3' : p === '/faqs' ? '0.6' : '0.8');
const urlEntries = Object.keys(pageTitles).map((cpath) => {
  const alternates = [
    ...LANGS.map((l) => `      <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${localizePath(cpath, l)}" />`),
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizePath(cpath, 'pt')}" />`,
  ].join('\n');
  return `  <url>\n    <loc>${SITE_URL}${localizePath(cpath, 'pt')}</loc>\n${alternates}\n    <priority>${priorityFor(cpath)}</priority>\n  </url>`;
});
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>\n`;
writeFileSync(join(DIST, 'sitemap.xml'), sitemap);

// robots.txt — generated so its Sitemap URL tracks SITE_URL (one config updates
// both). Keeps the staff app out of search results (auth already blocks access;
// this just stops crawling/indexing). Each entry is a path prefix, so /admin
// covers all /admin/* routes. Public marketing pages stay crawlable.
const STAFF_DISALLOW = [
  '/portal', '/home', '/sessions', '/team', '/profile',
  '/my-evaluation', '/earnings', '/availability', '/announcements', '/admin',
];
const robots = `User-agent: *
Allow: /

# Staff portal + app — not for search engines (access is auth-gated separately)
${STAFF_DISALLOW.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(DIST, 'robots.txt'), robots);

console.log(`prerender-meta: wrote ${count} HTML shells for ${Object.keys(pageTitles).length} routes × ${LANGS.length} languages, plus sitemap.xml and robots.txt`);
