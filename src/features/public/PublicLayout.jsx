import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { site, nav, footer, schedule, contacts, LANGS } from './content';
import { LanguageProvider } from './LanguageProvider';
import { useT, useLang } from './i18n';
import Flag from './components/Flag';

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
  const close = () => setMenuOpen(false);

  return (
    <div className="public-site">
      <header className="pub-header">
        <div className="pub-container pub-nav">
          <Link to="/" className="pub-logo" onClick={close} aria-label={site.name}>
            <img src={site.logo} alt={site.name} />
          </Link>

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
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'is-active' : '')}
                  onClick={close}
                >
                  {t(item.label)}
                </NavLink>
              </li>
            ))}
            <li><Link to="/reservations" className="pub-cta" onClick={close}>{t('Reservar')}</Link></li>
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
            <h4>{t('Links Rápidos')}</h4>
            <ul>
              {footer.quickLinks.map((l) => (
                <li key={l.label}><Link to={l.to}>{t(l.label)}</Link></li>
              ))}
            </ul>
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
              <li>{t('Porto')}: {contacts.porto.phone}</li>
              <li>{t('Lisboa')}: {contacts.lisboa.phone}</li>
            </ul>
          </div>
          <div>
            <h4>{t('Links Úteis')}</h4>
            <ul>
              {footer.usefulLinks.map((l) => (
                <li key={l.label}>
                  {l.href
                    ? <a href={l.href} target="_blank" rel="noreferrer">{t(l.label)}</a>
                    : <Link to={l.to}>{t(l.label)}</Link>}
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
