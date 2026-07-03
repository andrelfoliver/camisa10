import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { RebrandAuthProvider } from './context/RebrandAuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { WishlistProvider } from './context/WishlistContext';

// Rebrand (new main site) pages
import RebrandLayout from './rebrand/components/RebrandLayout';
import RebrandHome from './rebrand/pages/Home';
import RebrandCategoryPage from './rebrand/pages/CategoryPage';
import RebrandProductPage from './rebrand/pages/ProductPage';
import RebrandAdmin from './rebrand/pages/RebrandAdmin';
import RebrandCheckout from './rebrand/pages/Checkout';
import RebrandAuth from './rebrand/pages/Auth';
import RebrandProfile from './rebrand/pages/Profile';
import RebrandAboutPage from './rebrand/pages/About';
import RebrandSearchPage from './rebrand/pages/SearchPage';
import RebrandAffiliatesPage from './rebrand/pages/Affiliates';
import Success from './pages/Success';
import NotFound from './pages/NotFound';

import { initAnalytics, trackEvent } from './services/analytics';

// ─── Redirect helpers ─────────────────────────────────────────────────────────

// /rebrand/colecao/:cat → /colecao/:cat
const RedirectRebrandCategory = () => {
  const { category_id } = useParams();
  return <Navigate to={`/colecao/${category_id}`} replace />;
};

// /rebrand/produto/:id → /produto/:id
const RedirectRebrandProduct = () => {
  const { id } = useParams();
  return <Navigate to={`/produto/${id}`} replace />;
};

// ─── Analytics / ScrollToTop ──────────────────────────────────────────────────

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AnalyticsTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    initAnalytics();

    const shoppingPaths = ['/', '/busca'];
    const isCategoryPath = pathname.startsWith('/colecao/');
    const blacklist = ['/checkout', '/auth', '/admin', '/sucesso', '/profile'];
    const isBlacklisted = blacklist.some(p => pathname.startsWith(p));

    if ((shoppingPaths.includes(pathname) || isCategoryPath) && !isBlacklisted) {
      sessionStorage.setItem('ifooty_last_browsed_path', pathname + (window.location.search || ''));
    }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('agent');
    if (ref) localStorage.setItem('ifooty_referrer', ref);

    trackEvent('PageView', { path: pathname });

    const saved = sessionStorage.getItem('ifooty_last_browsed_path');
    if (saved === '/checkout' || saved === '/auth') {
      sessionStorage.setItem('ifooty_last_browsed_path', '/');
    }
  }, [pathname]);
  return null;
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RebrandAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AnalyticsTracker />
                <Routes>

                  {/* ── Admin ─────────────────────────────────────── */}
                  <Route path="/admin" element={<RebrandAdmin />} />

                  {/* ── New main site (Rebrand at root) ───────────── */}
                  <Route element={<RebrandLayout />}>
                    <Route index element={<RebrandHome />} />
                    <Route path="colecao/:category_id" element={<RebrandCategoryPage />} />
                    <Route path="produto/:id" element={<RebrandProductPage />} />
                    <Route path="checkout" element={<RebrandCheckout />} />
                    <Route path="auth" element={<RebrandAuth />} />
                    <Route path="profile" element={<RebrandProfile />} />
                    <Route path="about" element={<RebrandAboutPage />} />
                    <Route path="busca" element={<RebrandSearchPage />} />
                    <Route path="affiliates" element={<RebrandAffiliatesPage />} />
                    <Route path="sucesso" element={<Success />} />
                  </Route>

                  {/* ── Legacy /rebrand/* redirects ───────────────── */}
                  <Route path="/rebrand" element={<Navigate to="/" replace />} />
                  <Route path="/rebrand/admin" element={<Navigate to="/admin" replace />} />
                  <Route path="/rebrand/colecao/:category_id" element={<RedirectRebrandCategory />} />
                  <Route path="/rebrand/produto/:id" element={<RedirectRebrandProduct />} />
                  <Route path="/rebrand/checkout" element={<Navigate to="/checkout" replace />} />
                  <Route path="/rebrand/auth" element={<Navigate to="/auth" replace />} />
                  <Route path="/rebrand/profile" element={<Navigate to="/profile" replace />} />
                  <Route path="/rebrand/about" element={<Navigate to="/about" replace />} />
                  <Route path="/rebrand/busca" element={<Navigate to="/busca" replace />} />
                  <Route path="/rebrand/affiliates" element={<Navigate to="/affiliates" replace />} />
                  <Route path="/rebrand/sucesso" element={<Navigate to="/sucesso" replace />} />
                  {/* Catch-all for any other /rebrand/* paths */}
                  <Route path="/rebrand/*" element={<Navigate to="/" replace />} />

                  {/* ── Legacy old site redirects ─────────────────── */}
                  <Route path="/afiliados" element={<Navigate to="/affiliates" replace />} />
                  <Route path="/perfil" element={<Navigate to="/profile" replace />} />
                  <Route path="/colecao/:category_id" element={<RebrandCategoryPage />} />
                  <Route path="/produto/:id" element={<RebrandProductPage />} />

                  {/* ── 404 ───────────────────────────────────────── */}
                  <Route path="*" element={<NotFound />} />

                </Routes>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </RebrandAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
