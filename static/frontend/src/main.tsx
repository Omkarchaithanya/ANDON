import './dev-bridge';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Suppress noisy third-party Chrome extension errors (MetaMask, Jobright, etc.) from polluting the console
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (
      msg.includes('message channel closed') ||
      msg.includes('runtime.lastError') ||
      msg.includes('ObjectMultiplex') ||
      msg.includes('no-site-target')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

/**
 * Application entry point.
 * Renders the root ANDON component into the Forge Custom UI iframe.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ANDON: Could not find root element to mount React application.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
