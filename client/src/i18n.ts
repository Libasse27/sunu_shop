import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import frTranslations from './locales/fr.json';
import enTranslations from './locales/en.json';

const savedLang = localStorage.getItem('language') || 'fr';

i18n.use(initReactI18next).init({
  fallbackLng: 'fr',
  lng: savedLang,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    fr: { translation: frTranslations },
    en: { translation: enTranslations },
  },
});

export default i18n;
