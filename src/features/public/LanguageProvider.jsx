import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LanguageContext } from './i18n';
import { LOCALE_CODES, canonicalPath } from './content';

// The public-site language is derived from the URL (#9): Portuguese is the
// unprefixed default; /en, /fr, /es select the other languages. Switching
// language navigates to the same page under the new prefix, so the URL stays the
// single source of truth (good for SEO, sharing and the back button). Kept in its
// own file so i18n.jsx stays component-free (React Fast Refresh requirement).
export const LanguageProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const seg = location.pathname.split('/')[1];
  const lang = LOCALE_CODES.includes(seg) ? seg : 'pt';

  const setLang = useCallback((code) => {
    if (!LOCALE_CODES.includes(code)) return;
    const base = canonicalPath(location.pathname);
    const target = base === '/' ? `/${code}` : `/${code}${base}`;
    navigate(target + location.search + location.hash);
  }, [location.pathname, location.search, location.hash, navigate]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
