import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, MapPin, X, Menu } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { supabaseRebrand as supabase } from '../../services/supabase';

const NAV_LINKS = [
  { to: '/rebrand/colecao/soccer',       label: 'Soccer',       special: null },
  { to: '/rebrand/colecao/basketball',   label: 'Basketball',   special: null },
  { to: '/rebrand/colecao/football',     label: 'Football',     special: null },
  { to: '/rebrand/colecao/baseball',     label: 'Baseball',     special: null },
  { to: '/rebrand/colecao/hockey',       label: 'Hockey',       special: null },
  { to: '/rebrand/colecao/new-arrivals', label: 'New Arrivals', special: 'volt' },
  { to: '/rebrand/colecao/best-sellers', label: 'Best Sellers', special: null },
  { to: '/rebrand/colecao/sale',         label: 'Sale Items',   special: 'red' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut, isAdmin } = useRebrandAuth();
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const [displayName, setDisplayName] = useState('Hello, Sign In');
  const [accountStatus, setAccountStatus] = useState('My Account');
  const [accountLink, setAccountLink] = useState('/rebrand/auth');

  // Alternating promos for mobile/tablet top bar
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const promos = [
    { text: '🍁 Free Shipping Across Canada', url: null },
    { text: '⚡ VIP WhatsApp Group', url: 'https://chat.whatsapp.com/KKKNZoOnr57AanDT33KPrT', isExternal: true, isVolt: true }
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
        setDisplayName(`Hello, ${first}`);
        setAccountStatus('My Account');
        setAccountLink('/rebrand/profile');
      } else {
        const guestEmail = sessionStorage.getItem('ifooty_guest_email');
        const guestName = sessionStorage.getItem('ifooty_guest_name');
        if (guestEmail) {
          const first = guestName ? guestName.split(' ')[0] : guestEmail.split('@')[0];
          setDisplayName(`Hello, ${first}`);
          setAccountStatus('Guest');
          setAccountLink('/rebrand/checkout');
        } else {
          setDisplayName('Hello, Sign In');
          setAccountStatus('My Account');
          setAccountLink('/rebrand/auth');
        }
      }
    };

    updateAccountStatus();
    // Listen for storage changes (for guest name updates)
    window.addEventListener('storage', updateAccountStatus);
    return () => window.removeEventListener('storage', updateAccountStatus);
  }, [user, location.pathname]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    if (user) {
      await signOut();
    } else {
      sessionStorage.removeItem('ifooty_guest_email');
      sessionStorage.removeItem('ifooty_guest_name');
      window.dispatchEvent(new Event('storage'));
    }
    navigate('/rebrand');
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
    const filtered = allProducts.filter(p => 
      (p.name || '').toLowerCase().includes(queryLower) ||
      (p.category || '').toLowerCase().includes(queryLower)
    ).slice(0, 5); // Limit to top 5 hits
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
              <span>Free Shipping Across Canada</span>
            </div>
            <div className="rebrand-promobar-right">
              <a href="https://chat.whatsapp.com/KKKNZoOnr57AanDT33KPrT" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rebrand-volt)', textDecoration: 'none' }}>
                ⚡ VIP WhatsApp Group
              </a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <Link to="/rebrand/profile" style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={12} /> Track Order
              </Link>
            </div>
          </div>

          <div className="rebrand-promobar-mobile">
            <div className="rebrand-promobar-mobile-left" key={activePromoIndex}>
              {promos[activePromoIndex].url ? (
                <a 
                  href={promos[activePromoIndex].url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--rebrand-volt)', textDecoration: 'none', fontWeight: 700 }}
                >
                  {promos[activePromoIndex].text}
                </a>
              ) : (
                <span style={{ fontWeight: 700 }}>{promos[activePromoIndex].text}</span>
              )}
            </div>
            <div className="rebrand-promobar-mobile-right">
              <Link to="/rebrand/profile" style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                <MapPin size={12} /> Track Order
              </Link>
            </div>
          </div>
        </div>

        {/* NÍVEL 2: Header Principal */}
        <div className="rebrand-header-main">

          {/* Hamburger — LEFT side, mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rebrand-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={24} color="#ffffff" /> : <Menu size={24} color="#ffffff" />}
          </button>

          {/* Logo */}
          <div className="rebrand-logo-container" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Link to="/rebrand" className="rebrand-logo-text" style={{ color: '#ffffff', fontSize: '2.5rem' }}>
                <span className="logo-i">i</span>Footy<span className="logo-dot">.</span>
              </Link>
              <div className="rebrand-logo-underline" style={{ height: '3px' }}></div>
            </div>
            <span className="rebrand-slogan rebrand-hide-mobile" style={{ fontSize: '0.62rem', letterSpacing: '2.5px', marginTop: '5px', color: 'rgba(255,255,255,0.5)' }}>
              Canada's Sports Jersey Store
            </span>
          </div>

          {/* Search Bar — hidden on mobile */}
          <div className="rebrand-search-bar-desktop search-bar-container" style={{ position: 'relative' }}>
            <Search size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: '0.6rem', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Find your favorite team..."
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
                      navigate(`/rebrand/produto/${p.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                  >
                    <img src={p.image} alt={p.name} className="rebrand-suggestion-img" />
                    <div className="rebrand-suggestion-info">
                      <span className="rebrand-suggestion-name">{p.name}</span>
                      <span className="rebrand-suggestion-meta">{p.category} | ${p.price.toFixed(2)} CAD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="rebrand-header-actions">
            {/* Search icon — mobile only */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rebrand-show-mobile"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '0.25rem' }}
              aria-label="Search"
            >
              <Search size={22} color="rgba(255,255,255,0.85)" />
            </button>

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
                      ⚙️ Admin Panel
                    </Link>
                  )}
                  <Link to={user ? '/rebrand/profile' : '/rebrand/checkout'} style={{ borderBottom: '1px solid #f1f3f5' }}>
                    {user ? 'My Profile' : 'Guest Checkout'}
                  </Link>
                  <button onClick={handleSignOut} style={{ color: '#dc3545' }}>
                    {user ? 'Sign Out' : 'Exit Guest'}
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
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>My Cart</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>Jerseys bag</span>
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
              placeholder="Find your favorite team..."
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
                      navigate(`/rebrand/produto/${p.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                      setSearchOpen(false);
                    }}
                  >
                    <img src={p.image} alt={p.name} className="rebrand-suggestion-img" />
                    <div className="rebrand-suggestion-info">
                      <span className="rebrand-suggestion-name">{p.name}</span>
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
          {NAV_LINKS.map(({ to, label, special }) => (
            <Link
              key={to}
              to={to}
              className="rebrand-nav-link"
              style={{ color: getLinkColor(special), fontSize: '0.82rem', fontWeight: special ? 800 : 700, letterSpacing: '0.8px', whiteSpace: 'nowrap' }}
            >
              {label}
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
            placeholder="Find your favorite team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: '#ffffff', width: '100%' }}
          />
        </div>

        <nav className="rebrand-drawer-nav">
          {NAV_LINKS.map(({ to, label, special }) => (
            <Link
              key={to}
              to={to}
              className="rebrand-drawer-link"
              style={{ color: getLinkColor(special) }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
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
              <span>{user ? 'Sign Out' : 'Exit Guest'}</span>
            </button>
          )}
          <a href="https://chat.whatsapp.com/KKKNZoOnr57AanDT33KPrT" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rebrand-volt)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid #2C3034', fontWeight: 700 }}>
            ⚡ VIP WhatsApp Group
          </a>
          <Link to="/rebrand/profile" style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid #2C3034', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>
            <MapPin size={20} />
            <span>Track Order</span>
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
