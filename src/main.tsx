import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
// Global styles are now located under the styles folder.
import './styles/index.css';
import './utils/version'; // Initialize build info logging

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);