// Country dial codes offered in the phone-prefix dropdown (Portugal first).
// Country names are English exonyms for consistency (the flag signals the
// country regardless of the site language).
export const DIAL_CODES = [
  { code: 'pt', name: 'Portugal', dial: '+351' },
  { code: 'es', name: 'Spain', dial: '+34' },
  { code: 'fr', name: 'France', dial: '+33' },
  { code: 'gb', name: 'United Kingdom', dial: '+44' },
  { code: 'de', name: 'Germany', dial: '+49' },
  { code: 'ie', name: 'Ireland', dial: '+353' },
  { code: 'it', name: 'Italy', dial: '+39' },
  { code: 'nl', name: 'Netherlands', dial: '+31' },
  { code: 'be', name: 'Belgium', dial: '+32' },
  { code: 'ch', name: 'Switzerland', dial: '+41' },
  { code: 'pl', name: 'Poland', dial: '+48' },
  { code: 'ua', name: 'Ukraine', dial: '+380' },
  { code: 'ru', name: 'Russia', dial: '+7' },
  { code: 'br', name: 'Brazil', dial: '+55' },
];

// Default prefix for the current site language (falls back to Portugal).
const LANG_DIAL = { pt: '+351', en: '+44', fr: '+33', es: '+34' };
export const defaultDialForLang = (lang) => LANG_DIAL[lang] || '+351';

// Normalise a typed custom prefix to "+" followed by up to 4 digits.
export const sanitizeDial = (raw) => `+${(raw || '').replace(/\D/g, '').slice(0, 4)}`;
