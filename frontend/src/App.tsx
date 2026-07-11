import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CartProvider } from './lib/CartContext';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutPage } from './pages/CheckoutPage';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/pedido" element={<CheckoutPage />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}
