import {
    DEFAULT_SETTINGS,
    MODELS,
    STORAGE_KEYS,
    type Settings,
} from './constants';

function isSupportedModel(
    models: Record<string, unknown>,
    model: unknown,
): model is string {
    return typeof model === 'string' && Object.hasOwn(models, model);
}

const MODEL_MIGRATIONS = {
    GEMINI: {
        'gemini-3-pro-preview': DEFAULT_SETTINGS.geminiModel,
    },
    OPENAI: {},
} as const;

function resolveStoredModel(
    models: Record<string, unknown>,
    migrations: Record<string, string>,
    storedModel: unknown,
    defaultModel: string,
    modelIdPattern: RegExp,
): { model: string; migrated: boolean } {
    if (isSupportedModel(models, storedModel)) {
        return { model: storedModel, migrated: false };
    }

    if (
        typeof storedModel === 'string' &&
        Object.hasOwn(migrations, storedModel)
    ) {
        return { model: migrations[storedModel], migrated: true };
    }

    // Preserve syntactically valid unknown IDs for forward compatibility.
    // This allows settings written by a newer extension version to survive a
    // downgrade without accepting arbitrary inherited object properties.
    if (typeof storedModel === 'string' && modelIdPattern.test(storedModel)) {
        return { model: storedModel, migrated: false };
    }

    return {
        model: defaultModel,
        migrated: storedModel !== undefined && storedModel !== '',
    };
}

/**
 * Storage utility for managing extension settings and cache
 */
export class StorageManager {
    /**
     * Get settings from storage
     */
    static async getSettings(): Promise<Settings> {
        const result = await browser.storage.local.get(
            Object.values(STORAGE_KEYS),
        );

        const storedGeminiModel = result[STORAGE_KEYS.GEMINI_MODEL];
        const storedOpenAIModel = result[STORAGE_KEYS.OPENAI_MODEL];
        const resolvedGeminiModel = resolveStoredModel(
            MODELS.GEMINI,
            MODEL_MIGRATIONS.GEMINI,
            storedGeminiModel,
            DEFAULT_SETTINGS.geminiModel,
            /^gemini-[a-z0-9][a-z0-9.-]*$/,
        );
        const resolvedOpenAIModel = resolveStoredModel(
            MODELS.OPENAI,
            MODEL_MIGRATIONS.OPENAI,
            storedOpenAIModel,
            DEFAULT_SETTINGS.openaiModel,
            /^(?:gpt-[a-z0-9][a-z0-9.-]*|o\d[a-z0-9.-]*)$/,
        );
        const geminiModel = resolvedGeminiModel.model;
        const openaiModel = resolvedOpenAIModel.model;

        const migratedModels: Record<string, string> = {};
        if (resolvedGeminiModel.migrated) {
            migratedModels[STORAGE_KEYS.GEMINI_MODEL] = geminiModel;
        }
        if (resolvedOpenAIModel.migrated) {
            migratedModels[STORAGE_KEYS.OPENAI_MODEL] = openaiModel;
        }
        if (Object.keys(migratedModels).length > 0) {
            await browser.storage.local.set(migratedModels);
        }

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
            geminiModel,
            openaiModel,
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
            language:
                result[STORAGE_KEYS.LANGUAGE] || DEFAULT_SETTINGS.language,
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
        if (settings.language !== undefined) {
            storageData[STORAGE_KEYS.LANGUAGE] = settings.language;
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
        key: K,
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
