import { useState, useEffect } from 'react';
import { StorageManager } from '../../utils/storage';
import { CacheManager } from '../../utils/cache';
import { MODELS, DEFAULT_PROMPTS, type Settings, type ApiProvider, type Theme } from '../../utils/constants';
import '../../assets/theme.css';
import icon from '../../assets/icon.png';


function Options() {
    const [settings, setSettings] = useState<Settings>({
        apiProvider: 'gemini',
        geminiApiKey: '',
        openaiApiKey: '',
        geminiModel: 'gemini-2.0-flash-exp',
        openaiModel: 'gpt-4o-mini',
        customPrompts: {
            summarize: DEFAULT_PROMPTS.SUMMARIZE,
            question: DEFAULT_PROMPTS.QUESTION,
        },
        theme: 'warm',
    });

    const [saved, setSaved] = useState(false);
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

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
        setSettings(prev => ({
            ...prev,
            customPrompts: {
                summarize: DEFAULT_PROMPTS.SUMMARIZE,
                question: DEFAULT_PROMPTS.QUESTION,
            },
        }));
    };

    return (
        <div className="options-container" data-theme={settings.theme}>
            <header className="options-header">
                <div className="header-content">
                    <h1>AI Summary - Settings</h1>
                </div>
            </header>

            <div className="logo-container">
                <img src={icon} className="logo" alt="AI Summary Logo" />
            </div>



            <div className="options-content">
                {/* Theme Selection */}
                <section className="settings-section">
                    <h2>Appearance</h2>
                    <div className="provider-selection">
                        <label className={`provider-option ${settings.theme === 'warm' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="theme"
                                value="warm"
                                checked={settings.theme === 'warm'}
                                onChange={(e) => setSettings({ ...settings, theme: e.target.value as Theme })}
                            />
                            <span className="provider-name">Warm (Orange)</span>
                        </label>
                        <label className={`provider-option ${settings.theme === 'cool' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="theme"
                                value="cool"
                                checked={settings.theme === 'cool'}
                                onChange={(e) => setSettings({ ...settings, theme: e.target.value as Theme })}
                            />
                            <span className="provider-name">Cool (Purple)</span>
                        </label>
                    </div>
                </section>

                {/* API Provider Selection */}

                <section className="settings-section">
                    <h2>API Provider</h2>
                    <div className="provider-selection">
                        <label className={`provider-option ${settings.apiProvider === 'gemini' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="provider"
                                value="gemini"
                                checked={settings.apiProvider === 'gemini'}
                                onChange={(e) => setSettings({ ...settings, apiProvider: e.target.value as ApiProvider })}
                            />
                            <span className="provider-name">Google Gemini</span>
                        </label>
                        <label className={`provider-option ${settings.apiProvider === 'openai' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="provider"
                                value="openai"
                                checked={settings.apiProvider === 'openai'}
                                onChange={(e) => setSettings({ ...settings, apiProvider: e.target.value as ApiProvider })}
                            />
                            <span className="provider-name">OpenAI</span>
                        </label>
                    </div>
                </section>

                {/* Gemini Configuration */}
                {settings.apiProvider === 'gemini' && (
                    <section className="settings-section">
                        <h2>Gemini Configuration</h2>
                        <div className="form-group">
                            <label htmlFor="gemini-api-key">API Key</label>
                            <input
                                id="gemini-api-key"
                                type="password"
                                value={settings.geminiApiKey}
                                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                                placeholder="Enter your Gemini API key"
                                className="input-field"
                            />
                            <p className="help-text">
                                Get your API key from{' '}
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                                    Google AI Studio
                                </a>
                            </p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="gemini-model">Model</label>
                            <select
                                id="gemini-model"
                                value={settings.geminiModel}
                                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                                className="select-field"
                            >
                                {Object.entries(MODELS.GEMINI).map(([key, model]) => (
                                    <option key={key} value={key}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>
                )}

                {/* OpenAI Configuration */}
                {settings.apiProvider === 'openai' && (
                    <section className="settings-section">
                        <h2>OpenAI Configuration</h2>
                        <div className="form-group">
                            <label htmlFor="openai-api-key">API Key</label>
                            <input
                                id="openai-api-key"
                                type="password"
                                value={settings.openaiApiKey}
                                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                                placeholder="Enter your OpenAI API key"
                                className="input-field"
                            />
                            <p className="help-text">
                                Get your API key from{' '}
                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                                    OpenAI Platform
                                </a>
                            </p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="openai-model">Model</label>
                            <select
                                id="openai-model"
                                value={settings.openaiModel}
                                onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                                className="select-field"
                            >
                                {Object.entries(MODELS.OPENAI).map(([key, model]) => (
                                    <option key={key} value={key}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>
                )}

                {/* Custom Prompts */}
                <section className="settings-section">
                    <div className="section-header">
                        <h2>Custom Prompts</h2>
                        <button onClick={handleResetPrompts} className="reset-btn">
                            Reset to Default
                        </button>
                    </div>
                    <div className="form-group">
                        <label htmlFor="summarize-prompt">Summarization Prompt</label>
                        <textarea
                            id="summarize-prompt"
                            value={settings.customPrompts.summarize}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    customPrompts: { ...settings.customPrompts, summarize: e.target.value },
                                })
                            }
                            rows={6}
                            className="textarea-field"
                            placeholder="Enter custom summarization prompt. Use {content} as placeholder."
                        />
                        <p className="help-text">Use {'{content}'} as a placeholder for the page content.</p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="question-prompt">Question Answering Prompt</label>
                        <textarea
                            id="question-prompt"
                            value={settings.customPrompts.question}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    customPrompts: { ...settings.customPrompts, question: e.target.value },
                                })
                            }
                            rows={6}
                            className="textarea-field"
                            placeholder="Enter custom Q&A prompt. Use {context}, {summary}, and {question} as placeholders."
                        />
                        <p className="help-text">
                            Use {'{context}'}, {'{summary}'}, and {'{question}'} as placeholders.
                        </p>
                    </div>
                </section>

                {/* Cache Management */}
                <section className="settings-section">
                    <h2>Cache Management</h2>
                    <p className="section-description">
                        Clear cached summaries to free up storage or force regeneration.
                    </p>
                    <button onClick={handleClearCache} className="danger-btn">
                        {cleared ? '✓ Cache Cleared!' : 'Clear Cache'}
                    </button>
                </section>

                {/* Save Button */}
                <div className="save-container">
                    <button onClick={handleSave} className="save-btn">
                        {saved ? '✓ Settings Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Options;
