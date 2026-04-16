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
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Busca sugestões em tempo real
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('id, name, image')
        .or(`name.ilike.%${searchQuery}%,team.ilike.%${searchQuery}%`)
        .limit(5);
      
      if (data) setSuggestions(data);
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/busca?q=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* BARRA 1: TOP BAR (SITE GREEN) */}
      <div style={{ 
        background: 'var(--accent-color)', 
        color: '#000', 
        padding: '0.5rem', 
        textAlign: 'center', 
        fontSize: '0.85rem', 
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {language === 'pt' ? '🚀 Entrega prioritária para Calgary' : '🚀 Priority Delivery to Calgary'}
      </div>

      {/* BARRA 2: MAIN HEADER (SEARCH | LOGO | ACTIONS) */}
      <nav className="glass-panel" style={{
        position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0'
      }}>
        <div className="container" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto 1fr', 
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          
          {/* Coluna Esquerda: Menu (Mobile) / Busca (Desktop) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Desktop: Barra de Busca */}
            <div className="desktop-only">
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '220px' }}>
                <input 
                  type="text"
                  placeholder={language === 'pt' ? 'O que você procura?' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.6rem 1rem 0.6rem 2.3rem',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </form>
            </div>

            {/* Mobile: Botão de Menu */}
            <button 
              className="mobile-only" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              style={{ color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0' }}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

          {/* Coluna Central: Logo (Sempre centralizada) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontWeight: 900, 
              fontSize: '1.75rem', 
              fontFamily: 'var(--font-display)', 
              fontStyle: 'italic',
              letterSpacing: '-1.5px'
            }}>
              <span style={{ color: 'var(--accent-color)' }}>i</span><span style={{ color: '#fff' }}>Footy</span><span style={{ color: 'var(--accent-color)' }}>.</span>
            </Link>
          </div>
          
          {/* Coluna Direita: Ações (Lupa, Login, Sacola) */}
          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', justifyContent: 'flex-end' }}>
            
            {/* Language Switcher (Desktop) */}
            <div className="desktop-only" style={{ display: 'flex', gap: '0.4rem', marginRight: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '0.8rem' }}>
              <button onClick={() => setLanguage('pt')} style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden', padding: 0, border: 'none', background: 'none', cursor: 'pointer', opacity: language === 'pt' ? 1 : 0.3 }}>
                <img src="https://flagcdn.com/w40/br.png" alt="PT" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
              <button onClick={() => setLanguage('en')} style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden', padding: 0, border: 'none', background: 'none', cursor: 'pointer', opacity: language === 'en' ? 1 : 0.3 }}>
                <img src="https://flagcdn.com/w40/ca.png" alt="EN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            </div>

            {/* Lupa (Sempre visível no mobile, aciona o overlay/dropdown) */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              style={{ color: 'var(--text-main)', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
               <Search size={22} />
            </button>
            
            {/* Login / Perfil */}
            <button 
               onClick={() => {
                  if(!user) navigate('/auth');
                  else if(isAdmin) navigate('/admin');
                  else navigate('/perfil');
               }} 
               style={{ color: user ? 'var(--accent-color)' : 'var(--text-main)', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
               {user?.user_metadata?.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid var(--accent-color)`, objectFit: 'cover' }} />
               ) : (
                 <UserCircle size={24} />
               )}
            </button>
  
            {/* Carrinho */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', color: 'var(--text-main)', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <ShoppingBag size={24} />
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 0,
                  background: 'var(--accent-color)', color: '#000',
                  fontSize: '0.7rem', fontWeight: 'bold',
                  width: '16px', height: '16px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* BARRA 3: CATEGORY BAR (LINKS) */}
        <div className="desktop-only" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem', paddingTop: '1rem' }}>
          <div className="container" style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <Link to="/" style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_home')}</Link>
            <Link to="/colecao/selecoes" style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', color: 'var(--text-main)' }}>{language === 'pt' ? 'Seleções' : 'National Teams'}</Link>
            <Link to="/colecao/brasileirao" style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_br')}</Link>
            <Link to="/colecao/internacionais" style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_intl')}</Link>
            <Link to="/colecao/lancamentos" style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', color: 'var(--accent-color)' }}>{language === 'pt' ? 'Lançamentos' : 'New Drops'} 🔥</Link>
            <Link to="/colecao/retro" style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', color: 'var(--text-main)' }}>{t('nav_retro')}</Link>
          </div>
        </div>

        <style>{`
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
          @media (min-width: 992px) {
            .desktop-only { display: flex !important; }
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
            <button 
               onClick={() => { setIsSearchOpen(true); setMobileMenuOpen(false); }}
               style={{ textAlign: 'left', background: 'none', border: 'none', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
               <Search size={20} /> {language === 'pt' ? 'Buscar Produto' : 'Search Product'}
            </button>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>{t('nav_home')}</Link>
            <Link to="/colecao/selecoes" onClick={() => setMobileMenuOpen(false)}>{language === 'pt' ? 'Seleções' : 'National Teams'}</Link>
            <Link to="/colecao/brasileirao" onClick={() => setMobileMenuOpen(false)}>{t('nav_br')}</Link>
            <Link to="/colecao/internacionais" onClick={() => setMobileMenuOpen(false)}>{t('nav_intl')}</Link>
            <Link to="/colecao/lancamentos" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-color)' }}>{language === 'pt' ? 'Lançamentos' : 'New Drops'} 🔥</Link>
            <Link to="/colecao/retro" onClick={() => setMobileMenuOpen(false)}>{t('nav_retro')}</Link>
          </div>
        )}

      {/* SEARCH DROPDOWN (More elegant slide-down) */}
      {isSearchOpen && (
         <>
            {/* Subtle Backdrop */}
            <div 
               onClick={() => setIsSearchOpen(false)}
               style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 98, animation: 'fadeIn 0.2s ease-out' }}
            />
            
            <div style={{
              position: 'absolute', top: '100%', left: 0, width: '100%',
              background: '#0D0D14', borderBottom: '1px solid var(--accent-color)',
              padding: '1.5rem 0 2rem', zIndex: 99, 
              animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}>
               <div className="container" style={{ maxWidth: '800px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                     <h2 style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px' }}>
                        {language === 'pt' ? 'Encontre seu manto' : 'Find your jersey'}
                     </h2>
                     <button 
                        onClick={() => setIsSearchOpen(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
                     >
                        {language === 'pt' ? 'Fechar' : 'Close'} <X size={16} />
                     </button>
                  </div>

                  <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                     <input 
                       autoFocus
                       type="text"
                       placeholder={language === 'pt' ? 'Qual time você procura?' : 'Search for a team...'}
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       style={{
                          width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: '1.25rem', color: '#fff', padding: '1rem 3.5rem 1rem 1.5rem', outline: 'none',
                          borderRadius: '12px', transition: 'all 0.3s'
                       }}
                       onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                       onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                     />
                     <div style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-color)' }}>
                        <Search size={22} />
                     </div>
                  </form>

                  {/* Suggestions Popover */}
                  {suggestions.length > 0 && (
                     <div style={{ 
                        marginTop: '1rem', background: '#14141C', borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                     }}>
                        {suggestions.map(s => (
                           <Link 
                              key={s.id}
                              to={`/produto/${s.id}`}
                              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                              style={{
                                 display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.2rem',
                                 borderBottom: '1px solid rgba(255,255,255,0.03)',
                                 transition: 'all 0.2s', textDecoration: 'none'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(204, 255, 0, 0.05)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                           >
                              <img src={s.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                              <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 500 }}>{s.name}</span>
                              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                           </Link>
                        ))}
                        <button 
                           onClick={handleSearchSubmit}
                           style={{ 
                             width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', 
                             border: 'none', color: 'var(--accent-color)', fontSize: '0.85rem', 
                             fontWeight: 600, cursor: 'pointer' 
                           }}
                        >
                           {language === 'pt' ? `Ver todos para "${searchQuery}"` : `View all for "${searchQuery}"`}
                        </button>
                     </div>
                  )}
               </div>
            </div>
            
            <style>{`
               @keyframes slideDown {
                  from { opacity: 0; transform: translateY(-20px); }
                  to { opacity: 1; transform: translateY(0); }
               }
               @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
               }
            `}</style>
         </>
      )}
    </nav>
    </>
  );
};

export default Navbar;
