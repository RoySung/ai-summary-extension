import { useEffect, useState } from 'react';
import AboutMeContent from '../../components/AboutMeContent';
import SettingsContent from '../../components/SettingsContent';
import { DEFAULT_SETTINGS, type Settings } from '../../utils/constants';
import { useTranslate } from '../../hooks/useTranslate';
import { StorageManager } from '../../utils/storage';
import icon from '../../assets/icon.png';

type SettingsTab = 'settings' | 'about-me';

export default function SettingsApp() {
    const version = browser.runtime.getManifest().version;
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('settings');
    const t = useTranslate(settings.language);

    useEffect(() => {
        const loadSettings = async () => {
            const loadedSettings = await StorageManager.getSettings();
            setSettings(loadedSettings);
        };

        loadSettings();
    }, []);

    const handleSave = async () => {
        await StorageManager.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const activeTabDescription =
        activeTab === 'settings'
            ? t('settingsDescription')
            : t('aboutMeDescription');

    return (
        <div className="fullpage-app settings-page" data-theme={settings.theme}>
            <header className="fullpage-header">
                <div className="header-content">
                    <div className="logo-container">
                        <img src={icon} alt="AskWeb AI" className="logo-icon" />
                        <div className="settings-page-title-group">
                            <h1>AskWeb AI</h1>
                            <small className="settings-page-version">
                                {t('settings')} · v{version}
                            </small>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="settings-header-save-btn"
                    >
                        {saved ? t('settingsSaved') : t('saveSettings')}
                    </button>
                </div>
            </header>

            <main className="fullpage-content">
                <section className="page-info-full">
                    <div
                        className="settings-tabs"
                        role="tablist"
                        aria-label={t('settingsSections')}
                    >
                        <button
                            id="settings-tab"
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'settings'}
                            aria-controls="settings-panel"
                            className={`settings-tab-btn ${
                                activeTab === 'settings' ? 'active' : ''
                            }`}
                            onClick={() => setActiveTab('settings')}
                        >
                            {t('settings')}
                        </button>
                        <button
                            id="about-me-tab"
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'about-me'}
                            aria-controls="about-me-panel"
                            className={`settings-tab-btn ${
                                activeTab === 'about-me' ? 'active' : ''
                            }`}
                            onClick={() => setActiveTab('about-me')}
                        >
                            {t('aboutMe')}
                        </button>
                    </div>
                    <p className="settings-page-description">
                        {activeTabDescription}
                    </p>
                </section>

                <div className="settings-content-shell">
                    {activeTab === 'settings' ? (
                        <section
                            id="settings-panel"
                            role="tabpanel"
                            aria-labelledby="settings-tab"
                            className="settings-tab-panel"
                        >
                            <SettingsContent
                                settings={settings}
                                setSettings={setSettings}
                            />
                        </section>
                    ) : (
                        <section
                            id="about-me-panel"
                            role="tabpanel"
                            aria-labelledby="about-me-tab"
                            aria-label={t('aboutMe')}
                            className="settings-tab-panel"
                        >
                            <AboutMeContent language={settings.language} />
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
