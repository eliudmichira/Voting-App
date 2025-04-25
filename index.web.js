// Web-specific entry point
import './shim.js';  // Import polyfills first
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Simple function to initialize the app when the DOM is ready
function initApp() {
  // Find or create root element
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
  }

  // Create root and render
  const root = createRoot(document.getElementById('root'));
  root.render(createElement(App));
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Register for PWA (Progressive Web App) if service worker exists
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Add service worker registration here if needed
  });
} 