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

  const [waNumber, setWaNumber] = React.useState('5584991847739');

  React.useEffect(() => {
    async function getWa() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    getWa();
  }, []);

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
        position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', padding: '0.6rem 0'
      }}>
        <div className="container" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto 1fr', 
          alignItems: 'center',
          gap: '0.2rem',
          padding: '0 0.75rem' // Reduzido de 1.5rem para caber tudo no mobile
        }}>
          
          {/* Coluna Esquerda (3 Itens): Menu + WhatsApp + Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {/* 1. Menu (Mobile Only) */}
            <button 
              className="mobile-only" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              style={{ color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.35rem' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* 2. WhatsApp (Desktop + Mobile) */}
            <a 
              href={`https://wa.me/${waNumber.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', padding: '0.35rem' }}
              title="WhatsApp"
            >
              <svg 
                viewBox="0 0 24 24" 
                width="22" 
                height="22" 
                fill="currentColor" 
                style={{ transition: 'color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#25D366'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>

            {/* 3. Login / Perfil (Desktop + Mobile) */}
            <button 
               onClick={() => {
                  if(!user) navigate('/auth');
                  else if(isAdmin) navigate('/admin');
                  else navigate('/perfil');
               }} 
               style={{ color: user ? 'var(--accent-color)' : 'var(--text-main)', padding: '0.35rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
               title={user ? 'Minha Conta' : 'Fazer Login'}
            >
               {user?.user_metadata?.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '22px', height: '22px', borderRadius: '50%', border: `1px solid var(--accent-color)`, objectFit: 'cover' }} />
               ) : (
                 <UserCircle size={22} />
               )}
            </button>
          </div>

          {/* Coluna Central: Logo (Responsiva) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontWeight: 900, 
              fontSize: window.innerWidth < 500 ? '1.7rem' : '2.2rem', 
              fontFamily: 'var(--font-display)', 
              fontStyle: 'italic',
              letterSpacing: '-1.5px',
              transition: 'transform 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ color: 'var(--accent-color)' }}>i</span><span style={{ color: '#fff' }}>Footy</span><span style={{ color: 'var(--accent-color)' }}>.</span>
            </Link>
          </div>
          
          {/* Coluna Direita (3 Itens): Busca + Idioma + Sacola */}
          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', justifyContent: 'flex-end' }}>
            
            {/* 1. Busca (Desktop: Input | Mobile: Icon) */}
            <div className="desktop-only" style={{ marginRight: '0.2rem' }}>
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '160px' }}>
                <input 
                  type="text"
                  placeholder={language === 'pt' ? 'Buscar...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.4rem 0.8rem 0.4rem 2rem',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <Search size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </form>
            </div>
            <button 
              className="mobile-only"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              style={{ color: 'var(--text-main)', padding: '0.35rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
               <Search size={22} />
            </button>
            
            {/* 2. Seletor de Idioma (Hover - Estilo ifutz) */}
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px', padding: '0 0.5rem' }}
              onMouseEnter={(e) => {
                const menu = e.currentTarget.querySelector('.lang-dropdown');
                if(menu) menu.style.display = 'flex';
              }}
              onMouseLeave={(e) => {
                const menu = e.currentTarget.querySelector('.lang-dropdown');
                if(menu) menu.style.display = 'none';
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img 
                  src={language === 'pt' ? "https://flagcdn.com/w40/br.png" : "https://flagcdn.com/w40/ca.png"} 
                  alt="Current Lang" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              
              <div 
                className="lang-dropdown"
                style={{ 
                  display: 'none', position: 'absolute', top: '100%', right: 0, 
                  background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '0.5rem', flexDirection: 'column', gap: '0.5rem',
                  zIndex: 200, boxShadow: '0 10px 20px rgba(0,0,0,0.4)', minWidth: '40px'
                }}
              >
                <button onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')} style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', padding: 0 }}>
                  <img 
                    src={language === 'pt' ? "https://flagcdn.com/w40/ca.png" : "https://flagcdn.com/w40/br.png"} 
                    alt="Switch Lang" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </button>
              </div>
            </div>
  
            {/* 3. Carrinho */}
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
