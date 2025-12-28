import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import './index.css';

// Initialize global Buffer for browser compatibility (required by RSMV)
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
}
import App from './App';

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
