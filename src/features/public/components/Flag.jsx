// Inline SVG flag icons — emoji flags don't render on Windows browsers, so we
// draw them. Simplified but recognisable at small sizes.
const flags = {
  pt: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#DA291C" />
      <rect width="12" height="20" fill="#046A38" />
      <circle cx="12" cy="10" r="3.6" fill="#FFE000" stroke="#fff" strokeWidth="0.5" />
      <circle cx="12" cy="10" r="1.7" fill="#DA291C" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <clipPath id="gb-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#gb-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  ),
  fr: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#0055A4" />
      <rect x="20" width="10" height="20" fill="#EF4135" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 30 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="18" fill="#000" />
      <rect y="6" width="30" height="6" fill="#DD0000" />
      <rect y="12" width="30" height="6" fill="#FFCE00" />
    </svg>
  ),
  ie: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#169B62" />
      <rect x="20" width="10" height="20" fill="#FF883E" />
    </svg>
  ),
  it: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#009246" />
      <rect x="20" width="10" height="20" fill="#CE2B37" />
    </svg>
  ),
  nl: (
    <svg viewBox="0 0 30 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="18" fill="#fff" />
      <rect width="30" height="6" fill="#AE1C28" />
      <rect y="12" width="30" height="6" fill="#21468B" />
    </svg>
  ),
  be: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#000" />
      <rect x="10" width="10" height="20" fill="#FDDA24" />
      <rect x="20" width="10" height="20" fill="#EF3340" />
    </svg>
  ),
  ch: (
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="20" height="20" fill="#D52B1E" />
      <rect x="8" y="4" width="4" height="12" fill="#fff" />
      <rect x="4" y="8" width="12" height="4" fill="#fff" />
    </svg>
  ),
  ru: (
    <svg viewBox="0 0 30 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="18" fill="#fff" />
      <rect y="6" width="30" height="6" fill="#0039A6" />
      <rect y="12" width="30" height="6" fill="#D52B1E" />
    </svg>
  ),
  ua: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#FFD500" />
      <rect width="30" height="10" fill="#005BBB" />
    </svg>
  ),
  pl: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#DC143C" />
      <rect width="30" height="10" fill="#fff" />
    </svg>
  ),
  br: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#009C3B" />
      <polygon points="15,2 28,10 15,18 2,10" fill="#FFDF00" />
      <circle cx="15" cy="10" r="4" fill="#002776" />
    </svg>
  ),
};

const Flag = ({ code }) => flags[code] || flags[code === 'gb' ? 'en' : code] || null;

export default Flag;
