import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css"; 
import { HelmetProvider } from 'react-helmet-async'; // << ADDED: Import HelmetProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* << ADDED: Wrap the App with HelmetProvider for SEO to work globally */}
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);