import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();

  return (
    <header className="rebrand-navbar" style={{ padding: 0, borderBottom: '1px solid #2C3034' }}>
      
      {/* NÍVEL 1: Barra Promocional Superior (Promo Bar) */}
      <div style={{
        background: '#0B0C0E',
        color: '#ffffff',
        padding: '0.6rem 2rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--rebrand-volt)' }}>🍁</span>
          <span>Free Shipping on Orders Over $99 CAD Across Canada</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="https://chat.whatsapp.com/KKKNZoOnr57AanDT33KPrT" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rebrand-volt)', textDecoration: 'none' }}>
            ⚡ Join VIP WhatsApp Group for 10% Off
          </a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <Link to="/perfil" style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={12} /> Track Order
          </Link>
        </div>
      </div>

      {/* NÍVEL 2: Header Principal (Fundo Preto com Logo Neon Volt + Branco) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: '#121416',
        color: '#ffffff'
      }}>
        {/* Brand Logo & Slogan à Esquerda (Sem ícone) */}
        <div className="rebrand-logo-container" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Link to="/rebrand" className="rebrand-logo-text" style={{ color: '#ffffff', fontSize: '2.5rem' }}>
              <span className="logo-i">i</span>Footy<span className="logo-dot">.</span>
            </Link>
            <div className="rebrand-logo-underline" style={{ height: '3px' }}></div>
          </div>
          <span className="rebrand-slogan" style={{ fontSize: '0.62rem', letterSpacing: '2.5px', marginTop: '5px', color: 'rgba(255,255,255,0.5)' }}>
            Canada's Sports Jersey Store
          </span>
        </div>

        {/* Barra de Busca Centralizada com Fundo Escuro Contrastante */}
        <div style={{
          flex: 1,
          maxWidth: '650px',
          margin: '0 3rem',
          display: 'flex',
          alignItems: 'center',
          background: '#212529',
          borderRadius: '4px',
          padding: '0.6rem 1rem',
          border: '1px solid #2C3034',
          transition: 'all 0.2s',
        }}
        className="search-bar-container"
        >
          <Search size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: '0.6rem' }} />
          <input 
            type="text" 
            placeholder="Search jerseys by sport, league, team or player..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/busca?q=${encodeURIComponent(e.target.value)}`);
              }
            }}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
              color: '#ffffff',
              width: '100%',
              fontWeight: 500
            }}
          />
        </div>

        {/* Ações da Extrema Direita (Foco no contraste branco e volt) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>

          <Link to={user ? "/perfil" : "/auth"} style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="rgba(255,255,255,0.8)" />
            <div style={{ textAlign: 'left' }} className="hide-tablet">
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Hello, Sign In</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>My Account</span>
            </div>
          </Link>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#ffffff',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <div style={{ position: 'relative' }}>
              <ShoppingBag size={24} color="rgba(255,255,255,0.8)" />
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'var(--rebrand-volt)',
                  color: '#000000',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #121416'
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

      {/* NÍVEL 3: Links de Navegação por Esporte (Fundo Escuro e Bordas de Contraste) */}
      <nav className="rebrand-nav-links" style={{
        background: '#1A1D20',
        margin: 0,
        padding: '0.8rem 2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '2.5rem',
        borderTop: '1px solid #2C3034',
        borderBottom: '1px solid #2C3034'
      }}>
        <Link to="/rebrand/colecao/soccer" className="rebrand-nav-link" style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.8px' }}>Soccer</Link>
        <Link to="/rebrand/colecao/basketball" className="rebrand-nav-link" style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.8px' }}>Basketball</Link>
        <Link to="/rebrand/colecao/football" className="rebrand-nav-link" style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.8px' }}>Football</Link>
        <Link to="/rebrand/colecao/baseball" className="rebrand-nav-link" style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.8px' }}>Baseball</Link>
        <Link to="/rebrand/colecao/hockey" className="rebrand-nav-link" style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.8px' }}>Hockey</Link>
        <Link to="/rebrand/colecao/new-arrivals" className="rebrand-nav-link" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--rebrand-volt)', letterSpacing: '0.8px' }}>New Arrivals</Link>
        <Link to="/rebrand/colecao/best-sellers" className="rebrand-nav-link" style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.8px' }}>Best Sellers</Link>
        <Link to="/rebrand/colecao/sale" className="rebrand-nav-link" style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc3545', letterSpacing: '0.8px' }}>Sale Items</Link>
      </nav>
    </header>
  );
};

export default Navbar;
