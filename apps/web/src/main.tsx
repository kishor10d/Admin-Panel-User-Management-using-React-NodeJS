import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'admin-lte/dist/css/adminlte.min.css';
import './styles/globals.css';
import './styles/adminlte-overrides.css';
import { App } from './app/app';
import { AppProviders } from './app/providers';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <BrowserRouter><App /></BrowserRouter>
    </AppProviders>
  </StrictMode>,
);
