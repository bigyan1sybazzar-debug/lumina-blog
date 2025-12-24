import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Order matters: Library styles first, then your custom index.css
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css"; 
import './index.css';

import { HelmetProvider } from 'react-helmet-async';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create the root once
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* HelmetProvider ensures all <Helmet> tags inside App update the <head> */}
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);