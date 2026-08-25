import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, MapPin, X, Menu, Globe, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { formatProductName, translateToPortuguese } from '../utils/format';

const NAV_LINKS = [
  { to: '/colecao/soccer',       labelKey: 'rb_nav_soccer',       special: null },
  { to: '/colecao/basketball',   labelKey: 'rb_nav_basketball',   special: null },
  { to: '/colecao/football',     labelKey: 'rb_nav_football',     special: null },
  { to: '/colecao/baseball',     labelKey: 'rb_nav_baseball',     special: null },
  { to: '/colecao/hockey',       labelKey: 'rb_nav_hockey',       special: null },
  { to: '/colecao/new-arrivals', labelKey: 'rb_nav_new_arrivals', special: 'volt' },
  { to: '/colecao/best-sellers', labelKey: 'rb_nav_best_sellers', special: null },
  { to: '/colecao/sale',         labelKey: 'rb_nav_sale',         special: 'red' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', flag: '🇨🇦', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut, isAdmin } = useRebrandAuth();
  const { t, language, setLanguage } = useLanguage();
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  // Language selector state
  const [langOpen, setLangOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [drawerLangOpen, setDrawerLangOpen] = useState(false);
  const langRef = useRef(null);
  const mobileLangRef = useRef(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (mobileLangRef.current && !mobileLangRef.current.contains(e.target)) {
        setMobileLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [displayName, setDisplayName] = useState(t('rb_hello_sign_in'));
  const [accountStatus, setAccountStatus] = useState(t('rb_my_account'));
  const [accountLink, setAccountLink] = useState('/auth');

  // Alternating promos for mobile/tablet top bar
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const currentLangObj = LANGUAGE_OPTIONS.find(l => l.code === language) || LANGUAGE_OPTIONS[0];

  const promos = [
    { text: `🍁 ${t('rb_free_shipping')}`, url: null },
    { text: `⚡ ${t('rb_vip_whatsapp')}`, url: 'https://chat.whatsapp.com/BRxOBGKn84E8n3kiaqh7Jv?s=cl&p=i&mlu=2', isExternal: true, isVolt: true }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromoIndex((prev) => (prev + 1) % promos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateAccountStatus = () => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email || '';
        const first = name.split(' ')[0] || 'User';
        setDisplayName(`${t('rb_hello_sign_in').split(',')[0]}, ${first}`);
        setAccountStatus(t('rb_my_account'));
        setAccountLink('/profile');
      } else {
        const guestEmail = sessionStorage.getItem('ifooty_guest_email');
        const guestName = sessionStorage.getItem('ifooty_guest_name');
        if (guestEmail) {
          const first = guestName ? guestName.split(' ')[0] : guestEmail.split('@')[0];
          setDisplayName(`${t('rb_hello_sign_in').split(',')[0]}, ${first}`);
          setAccountStatus(t('rb_guest'));
          setAccountLink('/checkout');
        } else {
          setDisplayName(t('rb_hello_sign_in'));
          setAccountStatus(t('rb_my_account'));
          setAccountLink('/auth');
        }
      }
    };

    updateAccountStatus();
    // Listen for storage changes (for guest name updates)
    window.addEventListener('storage', updateAccountStatus);
    return () => window.removeEventListener('storage', updateAccountStatus);
  }, [user, location.pathname, language]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    if (user) {
      await signOut();
    } else {
      sessionStorage.removeItem('ifooty_guest_email');
      sessionStorage.removeItem('ifooty_guest_name');
      window.dispatchEvent(new Event('storage'));
    }
    navigate('/');
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Autocomplete Suggestions State
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch products once on mount for instant client-side autocomplete filtering
  useEffect(() => {
    async function fetchProductsForSearch() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, image, category')
          .order('id', { ascending: false });
        if (data) {
          // Format image path as done on product pages
          const formatted = data.map(p => ({
            ...p,
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
            price: p.price || 89.90
          }));
          setAllProducts(formatted);
        }
      } catch (err) {
        console.error("Failed to load search autocomplete pool:", err);
      }
    }
    fetchProductsForSearch();
  }, []);

  // Filter products instantly as the user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const queryLower = searchQuery.toLowerCase();
    const translatedQuery = translateToPortuguese(searchQuery).toLowerCase();
    const filtered = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const formattedName = formatProductName(p.name).toLowerCase();
      const category = (p.category || '').toLowerCase();
      
      return name.includes(queryLower) ||
             formattedName.includes(queryLower) ||
             name.includes(translatedQuery) ||
             formattedName.includes(translatedQuery) ||
             category.includes(queryLower) ||
             category.includes(translatedQuery);
    }).slice(0, 5); // Limit to top 5 hits
    setSearchResults(filtered);
  }, [searchQuery, allProducts]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/rebrand/busca?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    // Delay to let click events navigate before hiding suggestions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const getLinkColor = (special) => {
    if (special === 'volt') return 'var(--rebrand-volt)';
    if (special === 'red')  return '#ef4444';
    return '#ffffff';
  };

  return (
    <>
      <header className="rebrand-navbar" style={{ padding: 0, borderBottom: '1px solid #2C3034' }}>

        {/* NÍVEL 1: Promo Bar */}
        <div className="rebrand-promobar">
          <div className="rebrand-promobar-desktop">
            <div className="rebrand-promobar-left">
              <span style={{ color: 'var(--rebrand-volt)' }}>🍁</span>
              <span>{t('rb_free_shipping')}</span>
            </div>
            <div className="rebrand-promobar-right">
              <a href="https://chat.whatsapp.com/BRxOBGKn84E8n3kiaqh7Jv?s=cl&p=i&mlu=2" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rebrand-volt)', textDecoration: 'none' }}>
                ⚡ {t('rb_vip_whatsapp')}
              </a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <Link to='/profile' style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={12} /> {t('rb_track_order')}
              </Link>
            </div>
          </div>

          <div className="rebrand-promobar-mobile">
            <div className="rebrand-promobar-mobile-left" style={{ position: 'relative', height: '18px', minWidth: '180px', display: 'flex', alignItems: 'center' }}>
              <span 
                style={{ 
                  fontWeight: 700, 
                  position: 'absolute', 
                  left: 0, 
                  opacity: activePromoIndex === 0 ? 1 : 0, 
                  pointerEvents: activePromoIndex === 0 ? 'auto' : 'none',
                  transition: 'opacity 0.5s ease-in-out',
                  whiteSpace: 'nowrap'
                }}
              >
                🍁 {t('rb_free_shipping')}
              </span>
              <a 
                href="https://chat.whatsapp.com/BRxOBGKn84E8n3kiaqh7Jv?s=cl&p=i&mlu=2"
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  color: 'var(--rebrand-volt)', 
                  textDecoration: 'none', 
                  fontWeight: 700,
                  position: 'absolute', 
                  left: 0, 
                  opacity: activePromoIndex === 1 ? 1 : 0, 
                  pointerEvents: activePromoIndex === 1 ? 'auto' : 'none',
                  transition: 'opacity 0.5s ease-in-out',
                  whiteSpace: 'nowrap'
                }}
              >
                ⚡ {t('rb_vip_whatsapp')}
              </a>
            </div>
            <div className="rebrand-promobar-mobile-right">
              <Link to='/profile' style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                <MapPin size={12} /> {t('rb_track_order')}
              </Link>
            </div>
          </div>
        </div>

        {/* NÍVEL 2: Header Principal */}
        <div className="rebrand-header-main">

          {/* Left Controls — Hamburger + Search icon on mobile */}
          <div className="rebrand-show-mobile" style={{ alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rebrand-hamburger"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={24} color="#ffffff" /> : <Menu size={24} color="#ffffff" />}
            </button>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '0.25rem' }}
              aria-label="Search"
            >
              <Search size={22} color="rgba(255,255,255,0.85)" />
            </button>
          </div>

          {/* Logo */}
          <div className="rebrand-logo-container" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Link to="/rebrand" className="rebrand-logo-text" style={{ color: '#ffffff', fontSize: '2.5rem' }}>
                <span className="logo-i">i</span>Footy<span className="logo-dot">.</span>
              </Link>
              <div className="rebrand-logo-underline" style={{ height: '3px' }}></div>
            </div>
            <span className="rebrand-slogan rebrand-hide-mobile" style={{ fontSize: '0.62rem', letterSpacing: '2.5px', marginTop: '5px', color: 'rgba(255,255,255,0.5)' }}>
              {t('rb_slogan')}
            </span>
          </div>

          {/* Search Bar — hidden on mobile */}
          <div className="rebrand-search-bar-desktop search-bar-container" style={{ position: 'relative' }}>
            <Search size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: '0.6rem', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t('rb_search_placeholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleBlur}
              onKeyDown={handleSearch}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#ffffff', width: '100%', fontWeight: 500 }}
            />
            {/* Desktop Autocomplete Suggestions */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="rebrand-search-suggestions">
                {searchResults.map(p => (
                  <div 
                    key={p.id} 
                    className="rebrand-suggestion-item"
                    onClick={() => {
                      navigate(`/produto/${p.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                  >
                    <img src={p.image} alt={formatProductName(p.name)} className="rebrand-suggestion-img" />
                    <div className="rebrand-suggestion-info">
                      <span className="rebrand-suggestion-name">{formatProductName(p.name)}</span>
                      <span className="rebrand-suggestion-meta">{p.category} | ${p.price.toFixed(2)} CAD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="rebrand-header-actions">
            {/* Language Selector — Discreet, left of Account menu on Desktop & Mobile */}
            <div ref={langRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  transition: 'background 0.15s'
                }}
                aria-label="Select language"
              >
                <Globe size={15} style={{ opacity: 0.75 }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{currentLangObj.code.toUpperCase()}</span>
                <ChevronDown size={11} style={{ opacity: 0.6, transform: langOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#ffffff' }} />
              </button>

              {langOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: '#1A1D20', border: '1px solid #2C3034', borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)', padding: '0.3rem 0',
                  minWidth: '145px', zIndex: 9999
                }}>
                  {LANGUAGE_OPTIONS.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => { setLanguage(opt.code); setLangOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                        padding: '0.55rem 0.9rem', background: language === opt.code ? 'rgba(200,255,0,0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', color: language === opt.code ? 'var(--rebrand-volt)' : '#ffffff',
                        fontSize: '0.8rem', fontWeight: language === opt.code ? 700 : 500, textAlign: 'left',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => { if (language !== opt.code) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (language !== opt.code) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '1rem' }}>{opt.flag}</span>
                      <span>{opt.label}</span>
                      {language === opt.code && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account with Dropdown */}
            <div className="rebrand-account-menu-container" style={{ position: 'relative' }}>
              <Link to={accountLink} style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} 
                  />
                ) : (
                  <User size={22} color="rgba(255,255,255,0.8)" />
                )}
                <div style={{ textAlign: 'left' }} className="hide-tablet">
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>{displayName}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{accountStatus}</span>
                </div>
              </Link>
              {(user || sessionStorage.getItem('ifooty_guest_email')) && (
                <div className="rebrand-account-dropdown">
                  {isAdmin && (
                    <Link to="/rebrand/admin" style={{ borderBottom: '1px solid #f1f3f5', color: '#121416', fontWeight: 'bold' }}>
                      ⚙️ {t('rb_admin_panel')}
                    </Link>
                  )}
                  <Link to={user ? '/profile' : '/checkout'} style={{ borderBottom: '1px solid #f1f3f5' }}>
                    {user ? t('rb_my_profile') : t('rb_guest_checkout')}
                  </Link>
                  <button onClick={handleSignOut} style={{ color: '#dc3545' }}>
                    {user ? t('rb_sign_out') : t('rb_exit_guest')}
                  </button>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div style={{ position: 'relative' }}>
                <ShoppingBag size={24} color="rgba(255,255,255,0.8)" />
                {totalItems > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: 'var(--rebrand-volt)', color: '#000000',
                    fontSize: '0.65rem', fontWeight: 800,
                    width: '18px', height: '18px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #121416'
                  }}>
                    {totalItems}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'left' }} className="hide-tablet">
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>{t('rb_my_cart')}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{t('rb_jerseys_bag')}</span>
              </div>
            </button>


          </div>
        </div>

        {/* Mobile Search Bar — slides down */}
        {searchOpen && (
          <div className="rebrand-mobile-search" style={{ position: 'relative' }}>
            <Search size={18} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              placeholder={t('rb_search_placeholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleBlur}
              onKeyDown={handleSearch}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', color: '#ffffff', width: '100%' }}
            />
            <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} color="rgba(255,255,255,0.6)" />
            </button>
            {/* Mobile Autocomplete Suggestions */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="rebrand-search-suggestions mobile">
                {searchResults.map(p => (
                  <div 
                    key={p.id} 
                    className="rebrand-suggestion-item"
                    onClick={() => {
                      navigate(`/produto/${p.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                      setSearchOpen(false);
                    }}
                  >
                    <img src={p.image} alt={formatProductName(p.name)} className="rebrand-suggestion-img" />
                    <div className="rebrand-suggestion-info">
                      <span className="rebrand-suggestion-name">{formatProductName(p.name)}</span>
                      <span className="rebrand-suggestion-meta">{p.category} | ${p.price.toFixed(2)} CAD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NÍVEL 3: Nav Links — desktop horizontal scroll */}
        <nav className="rebrand-nav-links rebrand-hide-mobile" style={{
          background: '#1A1D20', margin: 0, padding: '0.8rem 2rem',
          display: 'flex', justifyContent: 'center', gap: '2.5rem',
          borderTop: '1px solid #2C3034', borderBottom: '1px solid #2C3034', overflowX: 'auto'
        }}>
          {NAV_LINKS.map(({ to, labelKey, special }) => (
            <Link
              key={to}
              to={to}
              className="rebrand-nav-link"
              style={{ color: getLinkColor(special), fontSize: '0.82rem', fontWeight: special ? 800 : 700, letterSpacing: '0.8px', whiteSpace: 'nowrap' }}
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <div className={`rebrand-drawer ${menuOpen ? 'rebrand-drawer-open' : ''}`}>
        <div className="rebrand-drawer-header">
          <Link to="/rebrand" className="rebrand-logo-text" style={{ color: '#ffffff', fontSize: '1.8rem' }} onClick={() => setMenuOpen(false)}>
            <span className="logo-i">i</span>Footy<span className="logo-dot">.</span>
          </Link>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#ffffff" />
          </button>
        </div>

        <div className="rebrand-drawer-search">
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <input
            type="text"
            placeholder={t('rb_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: '#ffffff', width: '100%' }}
          />
        </div>

        <nav className="rebrand-drawer-nav">
          {NAV_LINKS.map(({ to, labelKey, special }) => (
            <Link
              key={to}
              to={to}
              className="rebrand-drawer-link"
              style={{ color: getLinkColor(special) }}
              onClick={() => setMenuOpen(false)}
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="rebrand-drawer-footer">
          <Link to={accountLink} style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid #2C3034' }} onClick={() => setMenuOpen(false)}>
            <User size={20} />
            <span style={{ fontWeight: 600 }}>{displayName} ({accountStatus})</span>
          </Link>
          {(user || sessionStorage.getItem('ifooty_guest_email')) && (
            <button 
              onClick={(e) => { handleSignOut(e); setMenuOpen(false); }}
              style={{
                width: '100%', padding: '0.8rem 0', background: 'transparent', border: 'none',
                color: '#dc3545', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem',
                fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <User size={20} color="#dc3545" />
              <span>{user ? t('rb_sign_out') : t('rb_exit_guest')}</span>
            </button>
          )}
          {/* Mobile Language Selector in Drawer */}
          <div style={{ borderTop: '1px solid #2C3034', padding: '1rem 0' }}>
            <button
              onClick={() => setDrawerLangOpen(!drawerLangOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '0.95rem', padding: 0, width: '100%' }}
            >
              <Globe size={20} style={{ opacity: 0.7 }} />
              <span>{t('rb_language')}: {currentLangObj.label}</span>
              <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5, transform: drawerLangOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {drawerLangOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem', paddingLeft: '2.5rem' }}>
                {LANGUAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => { setLanguage(opt.code); setDrawerLangOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: language === opt.code ? 'var(--rebrand-volt)' : 'rgba(255,255,255,0.7)',
                      fontSize: '0.9rem', fontWeight: language === opt.code ? 700 : 500
                    }}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                    {language === opt.code && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="https://chat.whatsapp.com/BRxOBGKn84E8n3kiaqh7Jv?s=cl&p=i&mlu=2" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rebrand-volt)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid #2C3034', fontWeight: 700 }}>
            ⚡ {t('rb_vip_whatsapp')}
          </a>
          <Link to='/profile' style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid #2C3034', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>
            <MapPin size={20} />
            <span>{t('rb_track_order')}</span>
          </Link>
        </div>
      </div>

      <style>{`
        .rebrand-account-menu-container:hover .rebrand-account-dropdown {
          display: block;
        }
        .rebrand-account-dropdown {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 0.4rem 0;
          min-width: 160px;
          z-index: 9999;
          margin-top: 5px;
        }
        /* Transparent bridge to prevent mouse-leave when moving to dropdown */
        .rebrand-account-dropdown::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          height: 10px;
          background: transparent;
        }
        .rebrand-account-dropdown a, .rebrand-account-dropdown button {
          display: block;
          width: 100%;
          padding: 0.6rem 1rem;
          text-align: left;
          background: none;
          border: none;
          color: #121416;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          box-sizing: border-box;
        }
        .rebrand-account-dropdown a:hover, .rebrand-account-dropdown button:hover {
          background: #f8f9fa;
          color: #dc3545;
        }
      `}</style>
    </>
  );
};

export default Navbar;
