/**
 * Browser entry point: loads the Tailwind stylesheet, builds the production services and mounts the
 * app. The default theme's fonts and tokens are pulled in through the theme registry.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './app/App';
import { createDefaultServices } from './app/default-services';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App services={createDefaultServices()} />
  </StrictMode>,
);
