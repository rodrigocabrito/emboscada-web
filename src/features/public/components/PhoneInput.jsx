import { useState, useRef, useEffect } from 'react';
import Flag from './Flag';
import { useT } from '../i18n';
import { DIAL_CODES, sanitizeDial } from '../dialCodes';

// Phone field with a flag-based country-prefix dropdown and a digits-only input.
// The dropdown also has a free-text field for prefixes not in the list.
// Controlled: `prefix` (dial string) + `value` (digits) live in the parent form.
const PhoneInput = ({ id, prefix, onPrefixChange, value, onValueChange, required }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = DIAL_CODES.find((c) => c.dial === prefix); // undefined = custom prefix

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="pub-phone-field" ref={wrapRef}>
      <button
        type="button"
        className="pub-phone-prefix"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `${selected.name} ${selected.dial}` : prefix}
      >
        <span className="pub-phone-flag">
          {selected ? <Flag code={selected.code} /> : <span className="pub-phone-globe" aria-hidden="true">🌐</span>}
        </span>
        <span>{prefix}</span>
        <span className="pub-phone-caret" aria-hidden="true">▾</span>
      </button>

      <input
        id={id}
        type="tel"
        inputMode="numeric"
        className="pub-phone-number"
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ''))}
        required={required}
        autoComplete="tel-national"
      />

      {open && (
        <div className="pub-phone-menu" role="listbox">
          <div className="pub-phone-custom">
            <label htmlFor={`${id}-custom`}>{t('Outro código')}</label>
            <input
              id={`${id}-custom`}
              type="tel"
              inputMode="numeric"
              value={prefix}
              onChange={(e) => onPrefixChange(sanitizeDial(e.target.value))}
              placeholder="+___"
            />
          </div>
          <ul>
            {DIAL_CODES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.dial === prefix}
                  className={c.dial === prefix ? 'is-active' : ''}
                  onClick={() => { onPrefixChange(c.dial); setOpen(false); }}
                >
                  <span className="pub-phone-flag"><Flag code={c.code} /></span>
                  <span className="pub-phone-name">{c.name}</span>
                  <span className="pub-phone-dial">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
