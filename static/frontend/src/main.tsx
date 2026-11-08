import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

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
