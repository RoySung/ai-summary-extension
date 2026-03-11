import { useEffect, useState } from 'react';
import SettingsContent from '../../components/SettingsContent';
import { type Language, type Theme } from '../../utils/constants';
import { useTranslate } from '../../hooks/useTranslate';
import { StorageManager } from '../../utils/storage';
import icon from '../../assets/icon.png';

export default function SettingsApp() {
    const version = browser.runtime.getManifest().version;
    const [theme, setTheme] = useState<Theme>('warm');
    const [language, setLanguage] = useState<Language>('en-US');
    const t = useTranslate(language);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await StorageManager.getSettings();
            setTheme(settings.theme);
            setLanguage(settings.language);
        };

        loadSettings();
    }, []);

    return (
        <div className="fullpage-app settings-page" data-theme={theme}>
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
                </div>
            </header>

            <main className="fullpage-content">
                <section className="page-info-full">
                    <h2>{t('settings')}</h2>
                    <p className="settings-page-description">
                        {t('settingsDescription')}
                    </p>
                </section>

                <div className="settings-content-shell">
                    <SettingsContent
                        onThemeChange={setTheme}
                        onLanguageChange={setLanguage}
                    />
                </div>
            </main>
        </div>
    );
}
