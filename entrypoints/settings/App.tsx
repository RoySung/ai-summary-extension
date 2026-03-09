import { useState } from 'react';
import SettingsContent from '../../components/SettingsContent';
import { type Theme } from '../../utils/constants';
import icon from '../../assets/icon.png';

export default function SettingsApp() {
    const version = browser.runtime.getManifest().version;
    const [theme, setTheme] = useState<Theme>('warm');

    return (
        <div className="fullpage-app settings-page" data-theme={theme}>
            <header className="fullpage-header">
                <div className="header-content">
                    <div className="logo-container">
                        <img src={icon} alt="AskWeb AI" className="logo-icon" />
                        <div className="settings-page-title-group">
                            <h1>AskWeb AI</h1>
                            <small className="settings-page-version">
                                Settings · v{version}
                            </small>
                        </div>
                    </div>
                </div>
            </header>

            <main className="fullpage-content">
                <section className="page-info-full">
                    <h2>Settings</h2>
                    <p className="settings-page-description">
                        Configure your AI provider, models, theme, prompts, and
                        cache behavior in one dedicated page.
                    </p>
                </section>

                <div className="settings-content-shell">
                    <SettingsContent onThemeChange={setTheme} />
                </div>
            </main>
        </div>
    );
}
