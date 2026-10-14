import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LangProvider, SiteProvider, ToursProvider } from './store.jsx';
import './styles.css';
import './pages.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteProvider>
        <LangProvider>
          <ToursProvider>
            <App />
          </ToursProvider>
        </LangProvider>
      </SiteProvider>
    </BrowserRouter>
  </React.StrictMode>
);
