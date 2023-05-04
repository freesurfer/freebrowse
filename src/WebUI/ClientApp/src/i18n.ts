import de from '@/assets/locales/de.json';
import en from '@/assets/locales/en.json';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

export const defaultNS = 'translation';

export const resources = {
	en: {
		translation: en,
	},
	de: {
		translation: de,
	},
} as const;

void i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: 'en',
		debug: true,

		// have a common namespace used around the full app
		ns: ['translation'],
		defaultNS,

		keySeparator: false, // we use content as keys

		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
