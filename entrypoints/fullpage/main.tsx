import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../assets/theme.css';
import '../../assets/common.css';
import './style.css';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
