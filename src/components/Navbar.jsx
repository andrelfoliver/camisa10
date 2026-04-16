import React from 'react';
import { ShoppingBag, Menu, X, Search, UserCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { cartItems, setIsCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <div style={{ background: '#111111', color: '#f5c518', padding: '0.6rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
        {language === 'pt' ? '🚀 Entrega prioritária para Calgary' : '🚀 Priority Delivery to Calgary'}
      </div>
      <nav className="glass-panel" style={{
        position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', padding: '1rem 0'
      }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
          <img src="/favicon.png" alt="Camisa10" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span><span style={{ color: '#fff' }}>Camisa</span><span style={{ color: 'var(--accent-color)' }}>10</span></span>
        </Link>
        
        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }} className="desktop-nav">
          <Link to="/" style={{ fontWeight: 500, transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_home')}</Link>
          <Link to="/colecao/selecoes" style={{ fontWeight: 500, transition: 'color 0.2s', color: 'var(--text-main)' }}>{language === 'pt' ? 'Seleções' : 'National Teams'}</Link>
          <Link to="/colecao/brasileirao" style={{ fontWeight: 500, transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_br')}</Link>
          <Link to="/colecao/internacionais" style={{ fontWeight: 500, transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_intl')}</Link>
          <Link to="/colecao/lancamentos" style={{ fontWeight: 500, transition: 'color 0.2s', color: 'var(--accent-color)' }}>{language === 'pt' ? 'Lançamentos' : 'New Drops'} 🔥</Link>
          <Link to="/colecao/retro" style={{ fontWeight: 500, transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_retro')}</Link>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          
          {/* Language Switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', marginRight: '0.8rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '0.8rem' }}>
            <button 
              onClick={() => setLanguage('pt')} 
              title="Português"
              style={{ 
                width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', padding: 0,
                border: language === 'pt' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
                background: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: language === 'pt' ? 1 : 0.4
              }}
            >
              <img src="https://flagcdn.com/w40/br.png" alt="PT" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              title="English"
              style={{ 
                width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', padding: 0,
                border: language === 'en' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
                background: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: language === 'en' ? 1 : 0.4
              }}
            >
              <img src="https://flagcdn.com/w40/ca.png" alt="EN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          </div>

          <button style={{ color: 'var(--text-main)', padding: '0.5rem' }} className="desktop-nav">
             <Search size={22} />
          </button>
          
          <button 
             onClick={() => {
                if(!user) navigate('/auth');
                else if(isAdmin) navigate('/admin');
                else navigate('/perfil');
             }} 
             style={{ color: user ? 'var(--accent-color)' : 'var(--text-main)', padding: '0.5rem', marginLeft: '0.2rem' }}
          >
             {user?.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${isAdmin ? '#FFB81C' : 'var(--accent-color)'}`, objectFit: 'cover' }} />
             ) : (
               <UserCircle size={24} />
             )}
          </button>

          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ position: 'relative', color: 'var(--text-main)', padding: '0.5rem' }}
          >
            <ShoppingBag size={24} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -5,
                background: 'var(--accent-color)', color: '#000',
                fontSize: '0.75rem', fontWeight: 'bold',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {itemCount}
              </span>
            )}
          </button>
          
          <button className="mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--text-main)' }}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu inline styles just for demo */}
      <style>{`
        .desktop-nav { display: none !important; }
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
      
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, width: '100%',
          background: 'var(--surface-color)', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.2rem',
          borderBottom: '1px solid var(--border-color)', zIndex: 99
        }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>{t('nav_home')}</Link>
          <Link to="/colecao/selecoes" onClick={() => setMobileMenuOpen(false)}>{language === 'pt' ? 'Seleções' : 'National Teams'}</Link>
          <Link to="/colecao/brasileirao" onClick={() => setMobileMenuOpen(false)}>{t('nav_br')}</Link>
          <Link to="/colecao/internacionais" onClick={() => setMobileMenuOpen(false)}>{t('nav_intl')}</Link>
          <Link to="/colecao/lancamentos" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-color)' }}>{language === 'pt' ? 'Lançamentos' : 'New Drops'} 🔥</Link>
          <Link to="/colecao/retro" onClick={() => setMobileMenuOpen(false)}>{t('nav_retro')}</Link>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;
