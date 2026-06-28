import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const RebrandCartSidebar = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, subtotal, discount, cartTotal } = useCart();
  const { formatPrice } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [promoOpen, setPromoOpen] = useState(false);

  const handleContinueShopping = () => {
    setIsCartOpen(false);
    if (location.pathname === '/checkout') {
      const returnPath = sessionStorage.getItem('ifooty_last_browsed_path') || '/';
      navigate(returnPath);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          zIndex: 4999
        }}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: '100%', maxWidth: '420px', height: '100%',
        background: '#ffffff', zIndex: 5000,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        animation: 'rcSlideInRight 0.3s forwards',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>

        {/* Header */}
        <div style={{
          padding: '1.2rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #e9ecef', background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={20} color="#121416" />
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#121416', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              My Bag
            </h2>
            {cartItems.length > 0 && (
              <span style={{
                background: '#121416', color: '#fff',
                fontSize: '0.7rem', fontWeight: 800,
                borderRadius: '100px', padding: '2px 8px'
              }}>
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </div>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#121416', display: 'flex', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Urgency Banner */}
        {cartItems.length > 0 && (
          <div style={{
            background: '#fff8e1', borderBottom: '1px solid #ffe082',
            padding: '0.6rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.9rem' }}>🔥</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>
              Items May Sell Out, Order Now!
            </span>
          </div>
        )}

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '3rem', color: '#6c757d' }}>
              <ShoppingBag size={40} color="#dee2e6" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>Your bag is empty</p>
              <button
                onClick={handleContinueShopping}
                style={{ marginTop: '1rem', background: '#121416', color: '#fff', border: 'none', borderRadius: '100px', padding: '0.7rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartId} style={{
                display: 'flex', gap: '1rem',
                paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0'
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: '80px', height: '80px', flexShrink: 0,
                  background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: '2rem' }}>👕</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, fontSize: '0.88rem', color: '#121416', lineHeight: 1.3 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.78rem', color: '#6c757d' }}>
                    Size: <strong>{item.size}</strong>
                  </p>

                  {/* Extras */}
                  {item.extras?.nameNumber && (
                    <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.72rem', color: '#6c757d' }}>
                      ✍️ {item.extras.customName} #{item.extras.customNumber}
                    </p>
                  )}
                  {item.extras?.extraCustomization && (
                    <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.72rem', color: '#6c757d' }}>
                      ⭐️ {item.extras.customExtraName}
                    </p>
                  )}

                  {/* Quantity + Price row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    {/* Qty controls */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6',
                      padding: '2px 6px'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#121416', fontWeight: 700, fontSize: '1.1rem', padding: '0 4px', lineHeight: 1 }}
                      >−</button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '18px', textAlign: 'center', color: '#121416' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#121416', fontWeight: 700, fontSize: '1.1rem', padding: '0 4px', lineHeight: 1 }}
                      >+</button>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#121416' }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#6c757d' }}>
                          each {formatPrice(item.price)}
                        </p>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', marginLeft: '0.5rem', display: 'flex', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Totals + CTAs */}
        {cartItems.length > 0 && (
          <div style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid #e9ecef', background: '#ffffff' }}>

            {/* Promo Code - Fanatics Style */}
            <div style={{ borderBottom: '1px solid #e9ecef', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setPromoOpen(o => !o)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag size={14} color="#6c757d" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#121416' }}>
                    Have a Promo Code?
                  </span>
                </div>
                <span style={{ color: '#121416', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  {promoOpen ? '−' : 'ADD'}
                </span>
              </div>
              {promoOpen && (
                <p style={{ margin: '0.6rem 0 0 0', fontSize: '0.78rem', color: '#6c757d' }}>
                  Enter your promo code on the checkout page.
                </p>
              )}
            </div>

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#6c757d' }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {/* Discount */}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#16a34a', fontWeight: 700 }}>
                <span>Volume Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            {/* Cart Total - Prominent */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              background: '#f8f9fa', borderRadius: '8px',
              padding: '0.8rem 1rem', margin: '0.8rem 0'
            }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#121416' }}>Cart Total</span>
              <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#121416' }}>
                {formatPrice(cartTotal)}
              </span>
            </div>

            {/* Checkout CTA */}
            <button
              style={{
                width: '100%', padding: '1rem',
                background: '#121416', color: '#ffffff',
                border: 'none', borderRadius: '100px',
                fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer', marginBottom: '0.7rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#2d2d2d'}
              onMouseOut={e => e.currentTarget.style.background = '#121416'}
              onClick={() => { setIsCartOpen(false); navigate('/rebrand/checkout'); }}
            >
              Checkout <ArrowRight size={18} />
            </button>

            {/* Continue Shopping */}
            <button
              onClick={handleContinueShopping}
              style={{
                width: '100%', padding: '0.8rem',
                background: 'transparent', border: '1px solid #dee2e6',
                borderRadius: '100px', fontWeight: 700, fontSize: '0.9rem',
                color: '#121416', cursor: 'pointer'
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rcSlideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default RebrandCartSidebar;
