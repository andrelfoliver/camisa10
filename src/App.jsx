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
import AffiliateProgram from './pages/AffiliateProgram';
import NotFound from './pages/NotFound';
import SalesPopup from './components/SalesPopup';
import ExitIntentPopup from './components/ExitIntentPopup';
import FunkPlayer from './components/FunkPlayer';
import AiChatbot from './components/AiChatbot';

// Imports do Rebrand Isolado
import RebrandLayout from './rebrand/components/RebrandLayout';
import RebrandHome from './rebrand/pages/Home';
import RebrandCategoryPage from './rebrand/pages/CategoryPage';
import RebrandProductPage from './rebrand/pages/ProductPage';
import RebrandAdmin from './rebrand/pages/RebrandAdmin';
import RebrandCheckout from './rebrand/pages/Checkout';
import RebrandAuth from './rebrand/pages/Auth';
import RebrandProfile from './rebrand/pages/Profile';
import RebrandAboutPage from './rebrand/pages/About';
import { RebrandAuthProvider } from './context/RebrandAuthContext';

import { initAnalytics, trackEvent } from './services/analytics';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const AppLayout = () => {
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/rebrand/admin');
  const isRebrandPage = pathname.startsWith('/rebrand') && !pathname.startsWith('/rebrand/admin');
  const isBlacklisted = ['/checkout', '/auth', '/admin', '/rebrand/admin', '/perfil', '/sucesso', '/rebrand/sucesso'].some(p => pathname.startsWith(p));
  const [waNumber, setWaNumber] = useState('17788061419');

  // Inicializar o Analytics e capturar UTMs em cada mudança de rota (para garantir captura antes do envio do PageView)
  useEffect(() => {
    initAnalytics();

    // Lista de caminhos que representam "navegação de compras" (listas de produtos)
    const shoppingPaths = ['/', '/busca'];
    const isCategoryPath = pathname.startsWith('/colecao/');

    // Impedir que telas de processo ou admin sejam salvas como "último local de compra"
    const blacklist = ['/checkout', '/auth', '/admin', '/rebrand/admin', '/perfil', '/sucesso', '/rebrand/sucesso'];
    const isBlacklisted = blacklist.some(p => pathname.startsWith(p));

    if ((shoppingPaths.includes(pathname) || isCategoryPath) && !isBlacklisted) {
      sessionStorage.setItem('ifooty_last_browsed_path', pathname + (window.location.search || ''));
    }

    // Rastreamento de Agente/Referral
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('agent');
    if (ref) {
      localStorage.setItem('ifooty_referrer', ref);
    }

    // Disparar o PageView para todos os canais de analytics
    trackEvent('PageView', { path: pathname });

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
      {!isAdminPage && !isRebrandPage && <Navbar />}
      {!isRebrandPage && <CartSidebar />}
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
          <Route path="/afiliados" element={<AffiliateProgram />} />
          <Route path="/sucesso" element={<Success />} />

          {/* Rotas de Rebranding Isoladas */}
          <Route path="/rebrand/*" element={
            <RebrandAuthProvider>
              <Routes>
                <Route path="admin" element={<RebrandAdmin />} />
                <Route element={<RebrandLayout />}>
                  <Route index element={<RebrandHome />} />
                  <Route path="colecao/:category_id" element={<RebrandCategoryPage />} />
                  <Route path="produto/:id" element={<RebrandProductPage />} />
                  <Route path="checkout" element={<RebrandCheckout />} />
                  <Route path="auth" element={<RebrandAuth />} />
                  <Route path="profile" element={<RebrandProfile />} />
                  <Route path="about" element={<RebrandAboutPage />} />
                  <Route path="sucesso" element={<Success />} />
                </Route>
              </Routes>
            </RebrandAuthProvider>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminPage && !isRebrandPage && <Footer />}


      {/* WhatsApp Group Vertical Banner */}
      {!isAdminPage && !isRebrandPage && (
        <a 
          href="https://chat.whatsapp.com/KKKNZoOnr57AanDT33KPrT?mode=gi_t" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="whatsapp-group-float"
          title="Entrar no Grupo VIP"
        >
          <span>Grupo no WhatsApp</span>
        </a>
      )}

      {/* 
        Sales Popup Widget
        Only display on storefront pages, hide on Admin to reduce noise. 
      */}
      {!isAdminPage && !isRebrandPage && <SalesPopup />}

      {/* Exit Intent Feedback Popup - Enabled on all pages except to avoid blocking navigation */}
      {!isAdminPage && !isRebrandPage && <ExitIntentPopup />}

      {/* Funk Player */}
      {!isAdminPage && !isRebrandPage && <FunkPlayer />}

      {/* AI Chatbot Assistant */}
      {!isAdminPage && !isRebrandPage && <AiChatbot />}
    </div>
  );
};

import { LanguageProvider } from './context/LanguageContext';
import { WishlistProvider } from './context/WishlistContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppLayout />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
