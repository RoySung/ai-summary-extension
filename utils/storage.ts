import { DEFAULT_SETTINGS, STORAGE_KEYS, type Settings } from './constants';

/**
 * Storage utility for managing extension settings and cache
 */
export class StorageManager {
    /**
     * Get settings from storage
     */
    static async getSettings(): Promise<Settings> {
        const result = await browser.storage.local.get(
            Object.values(STORAGE_KEYS)
        );

        return {
            apiProvider:
                result[STORAGE_KEYS.API_PROVIDER] ||
                DEFAULT_SETTINGS.apiProvider,
            geminiApiKey:
                result[STORAGE_KEYS.GEMINI_API_KEY] ||
                DEFAULT_SETTINGS.geminiApiKey,
            openaiApiKey:
                result[STORAGE_KEYS.OPENAI_API_KEY] ||
                DEFAULT_SETTINGS.openaiApiKey,
            geminiModel:
                result[STORAGE_KEYS.GEMINI_MODEL] ||
                DEFAULT_SETTINGS.geminiModel,
            openaiModel:
                result[STORAGE_KEYS.OPENAI_MODEL] ||
                DEFAULT_SETTINGS.openaiModel,
            customPrompts:
                result[STORAGE_KEYS.CUSTOM_PROMPTS] ||
                DEFAULT_SETTINGS.customPrompts,
            savedPrompts:
                result[STORAGE_KEYS.SAVED_PROMPTS] ||
                DEFAULT_SETTINGS.savedPrompts,
            defaultPromptId:
                result[STORAGE_KEYS.DEFAULT_PROMPT_ID] ||
                DEFAULT_SETTINGS.defaultPromptId,
            theme: result[STORAGE_KEYS.THEME] || DEFAULT_SETTINGS.theme,
            showFloatingBall:
                result[STORAGE_KEYS.SHOW_FLOATING_BALL] ??
                DEFAULT_SETTINGS.showFloatingBall,
        };
    }

    /**
     * Save settings to storage
     */
    static async saveSettings(settings: Partial<Settings>): Promise<void> {
        const storageData: Record<string, any> = {};

        if (settings.apiProvider !== undefined) {
            storageData[STORAGE_KEYS.API_PROVIDER] = settings.apiProvider;
        }
        if (settings.geminiApiKey !== undefined) {
            storageData[STORAGE_KEYS.GEMINI_API_KEY] = settings.geminiApiKey;
        }
        if (settings.openaiApiKey !== undefined) {
            storageData[STORAGE_KEYS.OPENAI_API_KEY] = settings.openaiApiKey;
        }
        if (settings.geminiModel !== undefined) {
            storageData[STORAGE_KEYS.GEMINI_MODEL] = settings.geminiModel;
        }
        if (settings.openaiModel !== undefined) {
            storageData[STORAGE_KEYS.OPENAI_MODEL] = settings.openaiModel;
        }
        if (settings.customPrompts !== undefined) {
            storageData[STORAGE_KEYS.CUSTOM_PROMPTS] = settings.customPrompts;
        }
        if (settings.savedPrompts !== undefined) {
            storageData[STORAGE_KEYS.SAVED_PROMPTS] = settings.savedPrompts;
        }
        if (settings.defaultPromptId !== undefined) {
            storageData[STORAGE_KEYS.DEFAULT_PROMPT_ID] =
                settings.defaultPromptId;
        }
        if (settings.theme !== undefined) {
            storageData[STORAGE_KEYS.THEME] = settings.theme;
        }
        if (settings.showFloatingBall !== undefined) {
            storageData[STORAGE_KEYS.SHOW_FLOATING_BALL] =
                settings.showFloatingBall;
        }

        await browser.storage.local.set(storageData);
    }

    /**
     * Get a specific setting value
     */
    static async getSetting<K extends keyof Settings>(
        key: K
    ): Promise<Settings[K]> {
        const settings = await this.getSettings();
        return settings[key];
    }

    /**
     * Clear all settings (reset to defaults)
     */
    static async clearSettings(): Promise<void> {
        await browser.storage.local.remove(Object.values(STORAGE_KEYS));
    }
}
