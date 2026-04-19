import React from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

const CartSidebar = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, subtotal, discount, cartTotal } = useCart();
  const { t, language, translateProductDisplay } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleContinueShopping = () => {
    setIsCartOpen(false);
    
    // Se o usuário já estiver no checkout, "continuar comprando" deve levá-lo de volta ao catálogo
    if (location.pathname === '/checkout') {
      const returnPath = sessionStorage.getItem('ifooty_last_browsed_path') || '/';
      navigate(returnPath);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 999
        }}
        onClick={() => setIsCartOpen(false)}
      />
      <div 
        className="glass-panel"
        style={{
          position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '400px', height: '100%',
          background: 'var(--surface-color)', zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.3s forwards'
        }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-display)' }}>{t('cart_title')}</h2>
          <button onClick={() => setIsCartOpen(false)} style={{ color: 'var(--text-main)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>{t('cart_empty')}</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartId} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{translateProductDisplay(item.name)}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{language === 'pt' ? 'Tam' : 'Size'}: {item.size} • ${(item.price).toFixed(2)}</span>
                  
                  {/* Extras Tags */}
                  {(item.extras?.nameNumber || item.extras?.patch) && (
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                      {item.extras.nameNumber && <span style={{fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,184,28,0.2)', color: 'var(--accent-color)', borderRadius: '2px'}}>+ {language === 'pt' ? 'Nome/Num' : 'Name/Num'}</span>}
                      {item.extras.patch && <span style={{fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,184,28,0.2)', color: 'var(--accent-color)', borderRadius: '2px'}}>+ Patch</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', borderRadius: '4px', padding: '0.2rem' }}>
                      <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} style={{ padding: '0 0.5rem', color: 'var(--text-main)' }}>-</button>
                      <span style={{ fontSize: '0.9rem' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} style={{ padding: '0 0.5rem', color: 'var(--text-main)' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.cartId)} style={{ color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
            <span>{t('cart_subtotal')}</span>
            <span>${subtotal?.toFixed(2)} CAD</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem', color: '#10B981' }}>
              <span>{t('cart_discount')}</span>
              <span>-${discount.toFixed(2)} CAD</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
            <span>{t('cart_total')}</span>
            <span>${cartTotal?.toFixed(2)} CAD</span>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', marginBottom: '0.8rem' }}
            disabled={cartItems.length === 0}
            onClick={() => {
              setIsCartOpen(false);
              navigate('/checkout');
            }}
          >
            {t('cart_checkout')} <ArrowRight size={20} />
          </button>

          <button 
            style={{ 
              width: '100%', padding: '1rem', 
              background: 'transparent', 
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onClick={handleContinueShopping}
          >
            {t('cart_continue_shopping')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default CartSidebar;
