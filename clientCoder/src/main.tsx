import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './ide/ide.css';
import { installMonacoCancellationHandler } from '@phoneBot/screens/fileEditor';

installMonacoCancellationHandler();

const rootEl = document.getElementById('root');
if (rootEl) {
  rootEl.style.height = '100%';
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
