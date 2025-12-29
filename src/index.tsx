import './polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// --- ZERO-COST STRATEGY: GLOBAL KILL SWITCH ---
(window as any).ALLOW_PAID_SERVICES = false; // Default to HARD BLOCK
console.log('🛡️ ZERO-COST GUARDRAILS: ACTIVE. Paid services blocked by default.');

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
