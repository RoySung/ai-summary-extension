import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../../assets/theme.css';
import '../../assets/common.css';
import '../fullpage/style.css';
import icon from '../../assets/icon.png';

function OptionsRedirect() {
    const settingsUrl = browser.runtime.getURL('/settings.html');

    useEffect(() => {
        window.location.replace(settingsUrl);
    }, [settingsUrl]);

    return (
        <div className="fullpage-app" data-theme="warm">
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
                                Redirecting to Settings
                            </small>
                        </div>
                    </div>
                </div>
            </header>

            <main className="fullpage-content">
                <div className="no-summary">
                    <p>Redirecting to the new settings page...</p>
                    <p style={{ marginTop: '16px' }}>
                        If nothing happens,{' '}
                        <a href={settingsUrl} className="page-link">
                            open settings here
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
