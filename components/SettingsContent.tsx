import { useEffect, useState } from 'react';
import { StorageManager } from '../utils/storage';
import { CacheManager } from '../utils/cache';
import { generateUniqueId } from '../utils/id';
import {
    MODELS,
    DEFAULT_PROMPTS,
    PRESET_PROMPTS,
    DEFAULT_SETTINGS,
    type Settings,
    type ApiProvider,
    type Theme,
    type CustomPrompt,
} from '../utils/constants';
import './SettingsContent.css';

interface SettingsContentProps {
    onThemeChange?: (theme: Theme) => void;
}

export default function SettingsContent({
    onThemeChange,
}: SettingsContentProps) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        onThemeChange?.(settings.theme);
    }, [onThemeChange, settings.theme]);

    const loadSettings = async () => {
        const loadedSettings = await StorageManager.getSettings();
        setSettings(loadedSettings);
    };

    const handleSave = async () => {
        await StorageManager.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

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
            name: 'New Prompt',
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
                <h2>Appearance</h2>
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
                                    theme: e.target.value as Theme,
                                })
                            }
                        />
                        <span className="provider-name">Warm (Orange)</span>
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
                                    theme: e.target.value as Theme,
                                })
                            }
                        />
                        <span className="provider-name">Cool (Purple)</span>
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
                                    theme: e.target.value as Theme,
                                })
                            }
                        />
                        <span className="provider-name">Light</span>
                    </label>
                </div>
            </section>

            <section className="settings-section">
                <h2>API Provider</h2>
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
                        <span className="provider-name">Google Gemini</span>
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
                        <span className="provider-name">OpenAI</span>
                    </label>
                </div>
            </section>

            {settings.apiProvider === 'gemini' && (
                <section className="settings-section">
                    <h2>Gemini Configuration</h2>
                    <div className="form-group">
                        <label htmlFor="gemini-api-key">API Key</label>
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
                            placeholder="Enter your Gemini API key"
                            className="input-field"
                        />
                        <p className="help-text">
                            Get your API key from{' '}
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
                        <label htmlFor="gemini-model">Model</label>
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
                    <h2>OpenAI Configuration</h2>
                    <div className="form-group">
                        <label htmlFor="openai-api-key">API Key</label>
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
                            placeholder="Enter your OpenAI API key"
                            className="input-field"
                        />
                        <p className="help-text">
                            Get your API key from{' '}
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
                        <label htmlFor="openai-model">Model</label>
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
                    <h2>Prompt Manager</h2>
                    <button onClick={handleResetPrompts} className="reset-btn">
                        Reset Defaults
                    </button>
                </div>

                <div className="prompt-list">
                    {settings.savedPrompts?.map((prompt) => (
                        <div key={prompt.id} className="prompt-item">
                            <div className="prompt-item-header">
                                <div className="prompt-item-controls">
                                    <label
                                        title="Set as Default"
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
                                    disabled={
                                        prompt.id === 'default' ||
                                        settings.defaultPromptId === prompt.id
                                    }
                                >
                                    Delete
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
                                placeholder="Enter prompt content..."
                            />
                        </div>
                    ))}
                    <button
                        onClick={handleAddPrompt}
                        className="save-btn add-prompt-btn"
                    >
                        + Add New Prompt
                    </button>
                </div>

                <div className="form-group question-prompt-section">
                    <label htmlFor="question-prompt">
                        Question Answering Prompt
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
                        placeholder="Enter custom Q&A prompt. Use {context}, {summary}, and {question} as placeholders."
                    />
                    <p className="help-text">
                        Use {'{context}'}, {'{summary}'}, and {'{question}'} as
                        placeholders.
                    </p>
                </div>
            </section>

            <section className="settings-section">
                <h2>Cache Management</h2>
                <p className="section-description">
                    Clear cached summaries to free up storage or force
                    regeneration.
                </p>
                <button onClick={handleClearCache} className="danger-btn">
                    {cleared ? '✓ Cache Cleared!' : 'Clear Cache'}
                </button>
            </section>

            <div className="save-container">
                <button onClick={handleSave} className="save-btn">
                    {saved ? '✓ Settings Saved!' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
