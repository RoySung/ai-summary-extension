import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options';
import '../../assets/theme.css';
import '../../assets/common.css';
import './options.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>,
);
