// JSON-LD structured data builders for the public site. Kept separate from the
// DOM helpers (head.js) and the content data (content.js). Values mirror what's
// visible on the site so the markup stays honest for search engines.
import { contacts, pages, site } from './content';

// Two physical parks, each a SportsActivityLocation. `origin` is the live site
// origin (window.location.origin) so URLs/images are absolute.
export const businessJsonLd = (origin) => [
  {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${origin}/fields/porto`,
    name: `${site.name} — Porto`,
    url: `${origin}/fields/porto`,
    telephone: `+351${contacts.porto.phone.replace(/\D/g, '')}`,
    email: contacts.porto.email,
    image: `${origin}/site/campo-porto.jpg`,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua do Salgueiral – Várzea, Freguesia Canedo',
      addressLocality: 'Vila Nova de Gaia',
      addressCountry: 'PT',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 41.036333, longitude: -8.476667 },
    openingHours: 'Mo-Su 09:00-19:00',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${origin}/fields/monsanto`,
    name: `${site.name} — Lisboa (Monsanto)`,
    url: `${origin}/fields/monsanto`,
    telephone: `+351${contacts.lisboa.phone.replace(/\D/g, '')}`,
    email: contacts.lisboa.email,
    image: `${origin}/site/campo-monsanto.jpg`,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Lisboa Camping & Bungalows – Alto de Cabreira, Estrada da Circunvalação',
      postalCode: '1400-061',
      addressLocality: 'Lisboa',
      addressCountry: 'PT',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 38.724861, longitude: -9.207889 },
    openingHours: 'Mo-Su 09:00-19:00',
  },
];

// FAQPage built from the real Q&As on /faqs — eligible for FAQ rich results.
export const faqJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: pages.faqs.items.map((it) => ({
    '@type': 'Question',
    name: it.q,
    acceptedAnswer: { '@type': 'Answer', text: it.a },
  })),
});
