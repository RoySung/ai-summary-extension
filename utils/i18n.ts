import i18next from 'i18next';
import { DEFAULT_SETTINGS, type Language } from './constants';
import enUSMessages from './locales/en-US.json';
import zhTWMessages from './locales/zh-TW.json';

const resources = {
    'en-US': {
        translation: enUSMessages,
    },
    'zh-TW': {
        translation: zhTWMessages,
    },
} as const;

export type TranslateOptions = Record<string, unknown>;

export const i18n = i18next.createInstance();

if (!i18n.isInitialized) {
    void i18n.init({
        lng: DEFAULT_SETTINGS.language,
        fallbackLng: DEFAULT_SETTINGS.language,
        supportedLngs: ['en-US', 'zh-TW'],
        resources,
        defaultNS: 'translation',
        ns: ['translation'],
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
        initImmediate: false,
    });
}

export function translate(
    language: Language,
    key: string,
    options?: TranslateOptions,
): string {
    return i18n.t(key, {
        lng: language,
        ...options,
    });
}
