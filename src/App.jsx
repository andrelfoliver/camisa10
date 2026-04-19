import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { supabase } from './services/supabase';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import ProductPage from './pages/ProductPage';
import CategoryPage from './pages/CategoryPage';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import Success from './pages/Success';
import NotFound from './pages/NotFound';
import WhatsAppIcon from './components/WhatsAppIcon';
import SalesPopup from './components/SalesPopup';
import ExitIntentPopup from './components/ExitIntentPopup';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const AppLayout = () => {
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith('/admin');
  const [waNumber, setWaNumber] = useState('5584991847739');

  useEffect(() => {
    // Lista de caminhos que representam "navegação de compras" (listas de produtos)
    const shoppingPaths = ['/', '/busca'];
    const isCategoryPath = pathname.startsWith('/colecao/');
    
    // Impedir que telas de processo ou admin sejam salvas como "último local de compra"
    const blacklist = ['/checkout', '/auth', '/admin', '/perfil', '/sucesso'];
    const isBlacklisted = blacklist.some(p => pathname.startsWith(p));

    if ((shoppingPaths.includes(pathname) || isCategoryPath) && !isBlacklisted) {
      sessionStorage.setItem('ifooty_last_browsed_path', pathname + (window.location.search || ''));
    }

    // Auto-correção: se por algum motivo o path salvo for o checkout ou auth, resetar para home
    const saved = sessionStorage.getItem('ifooty_last_browsed_path');
    if (saved === '/checkout' || saved === '/auth') {
      sessionStorage.setItem('ifooty_last_browsed_path', '/');
    }
  }, [pathname]);

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    loadConfig();
  }, []);

  return (
    <div className="global-wrapper">
      <Navbar />
      <CartSidebar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/colecao/:category_id" element={<CategoryPage />} />
          <Route path="/produto/:id" element={<ProductPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route path="/sucesso" element={<Success />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
      
      {/* Floating WhatsApp */}
      <a 
        href={`https://wa.me/${waNumber.replace(/\D/g, '')}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float"
        title="Fale Conosco"
      >
        <WhatsAppIcon size={32} />
      </a>
      
      {/* 
        Sales Popup Widget
        Only display on storefront pages, hide on Admin to reduce noise. 
      */}
      {!isAdminPage && <SalesPopup />}
      
      {/* Exit Intent Feedback Popup */}
      {!isAdminPage && <ExitIntentPopup />}
    </div>
  );
};

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop/>
            <AppLayout />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
