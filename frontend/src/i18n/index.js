import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './locales/ar.json';
import en from './locales/en.json';

// بنحدّث lang/dir على عنصر <html> تلقائياً كل ما تتغير اللغة - هاد ضروري مش تجميلي:
// اتجاه الصفحة كامل (RTL/LTR) بيعتمد على هاد الخاصية، وتخطيط Flexbox بالموقع مبني
// عليها عشان يرجع صح تلقائياً بالإنجليزي بدون ما نكرر كل كلاس اتجاه يدوياً
function applyDocumentDirection(lng) {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('lang', lng);
  document.documentElement.setAttribute('dir', dir);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    interpolation: { escapeValue: false }, // React أصلاً بيحمي من XSS، ما نحتاج escape مزدوج
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  });

applyDocumentDirection(i18n.resolvedLanguage || i18n.language || 'ar');
i18n.on('languageChanged', applyDocumentDirection);

export default i18n;
