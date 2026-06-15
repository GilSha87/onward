import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import he from './locales/he/translation.json';
import nl from './locales/nl/translation.json';
import es from './locales/es/translation.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'he', label: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
];

const STORAGE_KEY = 'onward_lang';

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
  } catch { /* localStorage unavailable */ }
  return 'en';
}

// Apply document direction + lang attributes for the active language.
export function applyDir(lang) {
  const meta = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  if (typeof document !== 'undefined') {
    document.documentElement.dir = meta.dir;
    document.documentElement.lang = meta.code;
  }
}

// Safety net for any locale value still left as an untranslated placeholder of
// the form "[TRANSLATE: English text]". The English source is embedded in the
// brackets, so we strip the wrapper and return that text instead of leaking the
// raw "[TRANSLATE: …]" marker into the UI.
const stripTranslatePlaceholder = {
  type: 'postProcessor',
  name: 'stripTranslatePlaceholder',
  process(value) {
    if (typeof value === 'string') {
      const m = value.match(/^\[TRANSLATE:\s*([\s\S]*)\]$/);
      if (m) return m[1];
    }
    return value;
  },
};

i18n
  .use(stripTranslatePlaceholder)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
      nl: { translation: nl },
      es: { translation: es },
    },
    lng: initialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    postProcess: ['stripTranslatePlaceholder'],
  });

// Persist + apply direction whenever language changes.
i18n.on('languageChanged', (lang) => {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  applyDir(lang);
});

applyDir(i18n.language);

export default i18n;
