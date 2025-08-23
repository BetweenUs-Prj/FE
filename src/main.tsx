import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Global styles are now located under the styles folder.
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);