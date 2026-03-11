import { useCallback } from 'react';
import { type Language } from '../utils/constants';
import { translate, type TranslateOptions } from '../utils/i18n';

// why don't use react-i18next? because it use translation in background. using i18next be more efficient, and we can use it in non-react code.
export function useTranslate(language: Language) {
    return useCallback(
        (key: string, options?: TranslateOptions) =>
            translate(language, key, options),
        [language],
    );
}
