import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../assets/theme.css';
import '../../assets/common.css';
import '../fullpage/style.css';
import icon from '../../assets/icon.png';
import { StorageManager } from '../../utils/storage';
import { type Language, type Theme } from '../../utils/constants';
import { useTranslate } from '../../hooks/useTranslate';

function OptionsRedirect() {
    const settingsUrl = browser.runtime.getURL('/settings.html');
    const [theme, setTheme] = useState<Theme>('warm');
    const [language, setLanguage] = useState<Language>('en-US');
    const t = useTranslate(language);

    useEffect(() => {
        const redirectToSettings = async () => {
            const settings = await StorageManager.getSettings();
            setTheme(settings.theme);
            setLanguage(settings.language);

            setTimeout(() => {
                window.location.replace(settingsUrl);
            }, 0);
        };

        redirectToSettings();
    }, [settingsUrl]);

    return (
        <div className="fullpage-app" data-theme={theme}>
            <header className="fullpage-header">
                <div className="header-content">
                    <div className="logo-container">
                        <img src={icon} alt="AskWeb AI" className="logo-icon" />
                        <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            <h1 style={{ margin: 0, lineHeight: '1.2' }}>
                                AskWeb AI
                            </h1>
                            <small style={{ fontSize: '12px', opacity: 0.6 }}>
                                {t('redirectingToSettings')}
                            </small>
                        </div>
                    </div>
                </div>
            </header>

            <main className="fullpage-content">
                <div className="no-summary">
                    <p>{t('redirectingToNewSettingsPage')}</p>
                    <p style={{ marginTop: '16px' }}>
                        {t('ifNothingHappens')}{' '}
                        <a href={settingsUrl} className="page-link">
                            {t('openSettingsHere')}
                        </a>
                        .
                    </p>
                </div>
            </main>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <OptionsRedirect />
    </React.StrictMode>,
);
