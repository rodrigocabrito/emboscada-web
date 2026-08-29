import { useState, useCallback } from 'react';
import { LanguageContext } from './i18n';

// Holds the current public-site language (persisted in localStorage) and
// exposes it via LanguageContext. Kept in its own file so i18n.jsx stays
// component-free (React Fast Refresh requirement).
export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('pubLang') || 'pt'; } catch { return 'pt'; }
  });
  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem('pubLang', code); } catch { /* ignore */ }
  }, []);
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
