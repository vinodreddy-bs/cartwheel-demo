import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles/tokens.css';
import './styles/base.css';
import App from './App.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { PromoProvider } from './context/PromoContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogProvider>
        <CartProvider>
          <PromoProvider>
            <App />
          </PromoProvider>
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  </StrictMode>,
);
