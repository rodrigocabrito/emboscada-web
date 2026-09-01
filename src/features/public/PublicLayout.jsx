import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { site, nav, footer, schedule, contacts, LANGS, pageTitles, pageMeta, telHref, canonicalPath, localizePath } from './content';
import { LanguageProvider } from './LanguageProvider';
import { useT, useLang } from './i18n';
import { setDescription, setCanonical, setSocialTags, setJsonLd, setAlternates } from './head';
import { businessJsonLd, faqJsonLd } from './structuredData';
import { PubLink, PubNavLink } from './components/LangLink';
import Flag from './components/Flag';

const OG_LOCALE = { pt: 'pt_PT', en: 'en_GB', fr: 'fr_FR', es: 'es_ES' };
const ALT_LANGS = ['pt', 'en', 'fr', 'es'];

const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="pub-lang" role="group" aria-label="Idioma">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`pub-lang-btn${l.code === lang ? ' is-active' : ''}`}
          onClick={() => setLang(l.code)}
          aria-label={l.label}
          aria-pressed={l.code === lang}
          title={l.label}
        >
          <Flag code={l.code} />
        </button>
      ))}
    </div>
  );
};

// Inner shell — lives inside LanguageProvider so it (and every page via Outlet)
// can translate.
const PublicShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const t = useT();
  const { lang } = useLang();
  const close = () => setMenuOpen(false);

  // Per-route, per-language SEO metadata: tab title (Option B "<page> · <brand>"),
  // meta description, canonical, Open Graph/Twitter card, and JSON-LD structured
  // data (business info site-wide; FAQ markup only on the FAQ page).
  useEffect(() => {
    const cpath = canonicalPath(location.pathname);
    const key = pageTitles[cpath];
    const title = key ? `${t(key)} · ${site.name}` : site.name;
    const description = pageMeta[cpath] || pageMeta['/'];
    const origin = window.location.origin;
    const url = origin + location.pathname;

    document.documentElement.lang = lang;
    document.title = title;
    setDescription(description);
    setCanonical(url);
    setAlternates([
      ...ALT_LANGS.map((l) => ({ hreflang: l, href: origin + localizePath(cpath, l) })),
      { hreflang: 'x-default', href: origin + localizePath(cpath, 'pt') },
    ]);
    setSocialTags({
      title,
      description,
      url,
      image: `${origin}/site/hero-1.jpg`,
      locale: OG_LOCALE[lang] || 'pt_PT',
      siteName: site.name,
    });
    setJsonLd('ld-business', businessJsonLd(origin));
    setJsonLd('ld-faq', cpath === '/faqs' ? faqJsonLd() : null);
  }, [location.pathname, lang, t]);

  return (
    <div className="public-site">
      <header className="pub-header">
        <div className="pub-container pub-nav">
          <PubLink to="/" className="pub-logo" onClick={close} aria-label={site.name}>
            <img src={site.logo} alt={site.name} />
          </PubLink>

          <button
            className="pub-nav-toggle"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ☰
          </button>

          <ul className={`pub-nav-links${menuOpen ? ' is-open' : ''}`}>
            {nav.map((item) => (
              <li key={item.to}>
                <PubNavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'is-active' : '')}
                  onClick={close}
                >
                  {t(item.label)}
                </PubNavLink>
              </li>
            ))}
            <li><PubLink to="/reservations" className="pub-cta" onClick={close}>{t('Reservar')}</PubLink></li>
            <li className="pub-lang-wrap"><LanguageSwitcher /></li>
          </ul>
        </div>
      </header>

      <main className="pub-main" key={location.pathname}>
        <Outlet />
      </main>

      <footer className="pub-footer">
        <div className="pub-container pub-footer-grid">
          <div>
            <h4>{t('Siga-nos')}</h4>
            <div className="pub-social">
              <a href="https://www.facebook.com/EmboscadaParqueAventura" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="ti ti-brand-facebook" aria-hidden="true"></i>
              </a>
              <a href="https://www.instagram.com/emboscada_parque_aventura" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="ti ti-brand-instagram" aria-hidden="true"></i>
              </a>
            </div>
          </div>
          <div>
            <h4>{t('Horários')}</h4>
            <ul>
              <li>{t('Verão')}: {t(schedule.verao)}</li>
              <li>{t('Inverno')}: {t(schedule.inverno)}</li>
            </ul>
          </div>
          <div>
            <h4>{t('Contactos')}</h4>
            <ul>
              <li>{t('Porto')}: <a href={telHref(contacts.porto.phone)}>{contacts.porto.phone}</a></li>
              <li>{t('Lisboa')}: <a href={telHref(contacts.lisboa.phone)}>{contacts.lisboa.phone}</a></li>
            </ul>
          </div>
          <div>
            <h4>{t('Links Úteis')}</h4>
            <ul>
              {footer.usefulLinks.map((l) => (
                <li key={l.label}>
                  {l.href
                    ? <a href={l.href} target="_blank" rel="noreferrer">{t(l.label)}</a>
                    : <PubLink to={l.to}>{t(l.label)}</PubLink>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pub-container pub-footer-note">{t(footer.legal)}</div>
      </footer>
    </div>
  );
};

const PublicLayout = () => (
  <LanguageProvider>
    <PublicShell />
  </LanguageProvider>
);

export default PublicLayout;
