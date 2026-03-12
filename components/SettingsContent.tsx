import { type Dispatch, type SetStateAction, useState } from 'react';
import { RiDeleteBin5Line } from 'react-icons/ri';
import { CacheManager } from '../utils/cache';
import { generateUniqueId } from '../utils/id';
import {
    MODELS,
    DEFAULT_PROMPTS,
    PRESET_PROMPTS,
    type Settings,
    type ApiProvider,
    type CustomPrompt,
} from '../utils/constants';
import { useTranslate } from '../hooks/useTranslate';
import './SettingsContent.css';

interface SettingsContentProps {
    settings: Settings;
    setSettings: Dispatch<SetStateAction<Settings>>;
}

export default function SettingsContent({
    settings,
    setSettings,
}: SettingsContentProps) {
    const [cleared, setCleared] = useState(false);
    const t = useTranslate(settings.language);

    const handleClearCache = async () => {
        await CacheManager.clear();
        setCleared(true);
        setTimeout(() => setCleared(false), 3000);
    };

    const handleResetPrompts = () => {
        setSettings((prev) => ({
            ...prev,
            customPrompts: {
                summarize: DEFAULT_PROMPTS.SUMMARIZE,
                question: DEFAULT_PROMPTS.QUESTION,
            },
            savedPrompts: PRESET_PROMPTS,
            defaultPromptId: 'default',
        }));
    };

    const handleAddPrompt = () => {
        const newPrompt: CustomPrompt = {
            id: generateUniqueId(),
            name: t('newPrompt'),
            content: '{content}',
        };
        setSettings((prev) => ({
            ...prev,
            savedPrompts: [...(prev.savedPrompts || []), newPrompt],
        }));
    };

    const handleUpdatePrompt = (id: string, updates: Partial<CustomPrompt>) => {
        setSettings((prev) => ({
            ...prev,
            savedPrompts:
                prev.savedPrompts?.map((prompt) =>
                    prompt.id === id ? { ...prompt, ...updates } : prompt,
                ) || [],
        }));

        if (updates.content !== undefined) {
            CacheManager.clearPromptCache(id);
        }
    };

    const handleDeletePrompt = (id: string) => {
        if (id === 'default') return;

        setSettings((prev) => ({
            ...prev,
            savedPrompts:
                prev.savedPrompts?.filter((prompt) => prompt.id !== id) || [],
            defaultPromptId:
                prev.defaultPromptId === id ? 'default' : prev.defaultPromptId,
        }));
    };

    return (
        <div className="settings-form">
            <section className="settings-section">
                <h2>{t('language')}</h2>
                <div className="provider-selection">
                    {(['en-US', 'zh-TW'] as Settings['language'][]).map(
                        (language) => (
                            <label
                                key={language}
                                className={`provider-option ${
                                    settings.language === language
                                        ? 'selected'
                                        : ''
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="language"
                                    value={language}
                                    checked={settings.language === language}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            language: e.target
                                                .value as Settings['language'],
                                        })
                                    }
                                />
                                <span className="provider-name">
                                    {t(`languageLabel.${language}`)}
                                </span>
                            </label>
                        ),
                    )}
                </div>
            </section>

            <section className="settings-section">
                <h2>{t('appearance')}</h2>
                <div className="provider-selection">
                    <label
                        className={`provider-option ${
                            settings.theme === 'warm' ? 'selected' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name="theme"
                            value="warm"
                            checked={settings.theme === 'warm'}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    theme: e.target.value as Settings['theme'],
                                })
                            }
                        />
                        <span className="provider-name">{t('warmTheme')}</span>
                    </label>
                    <label
                        className={`provider-option ${
                            settings.theme === 'cool' ? 'selected' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name="theme"
                            value="cool"
                            checked={settings.theme === 'cool'}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    theme: e.target.value as Settings['theme'],
                                })
                            }
                        />
                        <span className="provider-name">{t('coolTheme')}</span>
                    </label>
                    <label
                        className={`provider-option ${
                            settings.theme === 'light' ? 'selected' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={settings.theme === 'light'}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    theme: e.target.value as Settings['theme'],
                                })
                            }
                        />
                        <span className="provider-name">{t('lightTheme')}</span>
                    </label>
                </div>
            </section>

            <section className="settings-section">
                <h2>{t('apiProvider')}</h2>
                <div className="provider-selection">
                    <label
                        className={`provider-option ${
                            settings.apiProvider === 'gemini' ? 'selected' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name="provider"
                            value="gemini"
                            checked={settings.apiProvider === 'gemini'}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    apiProvider: e.target.value as ApiProvider,
                                })
                            }
                        />
                        <span className="provider-name">
                            {t('providerLabel.gemini')}
                        </span>
                    </label>
                    <label
                        className={`provider-option ${
                            settings.apiProvider === 'openai' ? 'selected' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name="provider"
                            value="openai"
                            checked={settings.apiProvider === 'openai'}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    apiProvider: e.target.value as ApiProvider,
                                })
                            }
                        />
                        <span className="provider-name">
                            {t('providerLabel.openai')}
                        </span>
                    </label>
                </div>
            </section>

            {settings.apiProvider === 'gemini' && (
                <section className="settings-section">
                    <h2>{t('geminiConfiguration')}</h2>
                    <div className="form-group">
                        <label htmlFor="gemini-api-key">{t('apiKey')}</label>
                        <input
                            id="gemini-api-key"
                            type="password"
                            value={settings.geminiApiKey}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    geminiApiKey: e.target.value,
                                })
                            }
                            placeholder={t('enterGeminiApiKey')}
                            className="input-field"
                        />
                        <p className="help-text">
                            {t('getApiKeyFrom')}{' '}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="gemini-model">{t('model')}</label>
                        <select
                            id="gemini-model"
                            value={settings.geminiModel}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    geminiModel: e.target.value,
                                })
                            }
                            className="select-field"
                        >
                            {Object.entries(MODELS.GEMINI).map(
                                ([key, model]) => (
                                    <option key={key} value={key}>
                                        {model.name}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </section>
            )}

            {settings.apiProvider === 'openai' && (
                <section className="settings-section">
                    <h2>{t('openaiConfiguration')}</h2>
                    <div className="form-group">
                        <label htmlFor="openai-api-key">{t('apiKey')}</label>
                        <input
                            id="openai-api-key"
                            type="password"
                            value={settings.openaiApiKey}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    openaiApiKey: e.target.value,
                                })
                            }
                            placeholder={t('enterOpenaiApiKey')}
                            className="input-field"
                        />
                        <p className="help-text">
                            {t('getApiKeyFrom')}{' '}
                            <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                OpenAI Platform
                            </a>
                        </p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="openai-model">{t('model')}</label>
                        <select
                            id="openai-model"
                            value={settings.openaiModel}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    openaiModel: e.target.value,
                                })
                            }
                            className="select-field"
                        >
                            {Object.entries(MODELS.OPENAI).map(
                                ([key, model]) => (
                                    <option key={key} value={key}>
                                        {model.name}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </section>
            )}

            <section className="settings-section">
                <div className="section-header">
                    <h2>{t('promptManager')}</h2>
                    <button onClick={handleResetPrompts} className="reset-btn">
                        {t('resetDefaults')}
                    </button>
                </div>

                <div className="prompt-list">
                    {settings.savedPrompts?.map((prompt) => (
                        <div key={prompt.id} className="prompt-item">
                            <div className="prompt-item-header">
                                <div className="prompt-item-controls">
                                    <label
                                        title={t('setAsDefault')}
                                        className="default-prompt-label"
                                    >
                                        <input
                                            type="radio"
                                            name="defaultPrompt"
                                            checked={
                                                settings.defaultPromptId ===
                                                prompt.id
                                            }
                                            onChange={() =>
                                                setSettings({
                                                    ...settings,
                                                    defaultPromptId: prompt.id,
                                                })
                                            }
                                        />
                                    </label>
                                    <input
                                        type="text"
                                        value={prompt.name}
                                        onChange={(e) =>
                                            handleUpdatePrompt(prompt.id, {
                                                name: e.target.value,
                                            })
                                        }
                                        className="input-field prompt-name-input"
                                    />
                                </div>
                                <button
                                    onClick={() =>
                                        handleDeletePrompt(prompt.id)
                                    }
                                    className="danger-btn danger-btn-small"
                                    title={t('delete')}
                                    aria-label={t('delete')}
                                    disabled={
                                        prompt.id === 'default' ||
                                        settings.defaultPromptId === prompt.id
                                    }
                                >
                                    <RiDeleteBin5Line aria-hidden="true" />
                                </button>
                            </div>
                            <textarea
                                value={prompt.content}
                                onChange={(e) =>
                                    handleUpdatePrompt(prompt.id, {
                                        content: e.target.value,
                                    })
                                }
                                rows={3}
                                className="textarea-field prompt-content-textarea"
                                placeholder={t('enterPromptContent')}
                            />
                        </div>
                    ))}
                    <button
                        onClick={handleAddPrompt}
                        className="save-btn add-prompt-btn"
                    >
                        {t('addNewPrompt')}
                    </button>
                </div>

                <div className="form-group question-prompt-section">
                    <label htmlFor="question-prompt">
                        {t('questionAnsweringPrompt')}
                    </label>
                    <textarea
                        id="question-prompt"
                        value={settings.customPrompts.question}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                customPrompts: {
                                    ...settings.customPrompts,
                                    question: e.target.value,
                                },
                            })
                        }
                        rows={6}
                        className="textarea-field"
                        placeholder={t('questionPromptPlaceholder')}
                    />
                    <p className="help-text">{t('questionPromptHelp')}</p>
                </div>
            </section>

            <section className="settings-section">
                <h2>{t('cacheManagement')}</h2>
                <p className="section-description">{t('cacheDescription')}</p>
                <button onClick={handleClearCache} className="danger-btn">
                    {cleared ? t('cacheCleared') : t('clearCache')}
                </button>
            </section>
        </div>
    );
}
