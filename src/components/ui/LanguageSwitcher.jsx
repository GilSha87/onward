import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (code) => {
    i18n.changeLanguage(code); // persistence + dir handled in i18n.js listener
    setOpen(false);
  };

  return (
    <div className="lang-switch" ref={ref} style={{ position: 'relative', marginLeft: 8 }}>
      <button
        className="btn ghost sm"
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 14 }}>{current.flag}</span>
        <span style={{ marginLeft: 6 }}>{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute', top: '100%', insetInlineEnd: 0, marginTop: 4,
            background: 'var(--surface)', border: '1px solid var(--hairline)',
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            padding: 4, minWidth: 160, zIndex: 50, listStyle: 'none',
          }}
        >
          {LANGUAGES.map(l => (
            <li key={l.code} role="option" aria-selected={l.code === current.code}>
              <button
                className="btn ghost sm"
                style={{
                  width: '100%', justifyContent: 'flex-start', gap: 8,
                  fontWeight: l.code === current.code ? 700 : 500,
                }}
                onClick={() => pick(l.code)}
              >
                <span style={{ fontSize: 14 }}>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
