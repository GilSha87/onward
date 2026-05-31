import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initMonitor } from './lib/monitor';

// Initialise error & API-failure instrumentation before the React tree mounts.
initMonitor();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
