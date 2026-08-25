import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Copy, Check, ShoppingBag, Flame, ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatProductName } from '../utils/format';

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const COUPON_CODE = 'WEEK10';

const WeeklyOfferPopup = () => {
  const navigate = useNavigate();
  const { addToCart, pricingConfig } = useCart();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedMap, setAddedMap] = useState({});

  const getSizeAddon = (size) => {
    if (['2XL', '3XL'].includes(size)) return Number(pricingConfig?.size2XL3XL || 7.00);
    if (size === '4XL') return Number(pricingConfig?.size4XL || 10.00);
    return 0;
  };

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('ifooty_weekly_offer_seen');
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Load on-sale products from database
  useEffect(() => {
    async function loadSaleItems() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (data) {
          // Filter products where is_sale is true
          let promos = data.filter(p => p.is_sale);
          // If no promo products yet, fallback to products with discount or first few items
          if (promos.length === 0) {
            promos = data.slice(0, 6);
          }

          const formatted = promos.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 89.90,
            oldPrice: (Number(p.price) || 89.90) + 30.00,
            category: p.category || 'Soccer',
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
            rating: p.rating || 4.9,
            reviews: p.reviews_count || 48
          }));

          setSaleProducts(formatted);

          // Default size 'M' for all products
          const initialSizes = {};
          formatted.forEach(p => { initialSizes[p.id] = 'M'; });
          setSelectedSizes(initialSizes);
        }
      } catch (err) {
        console.error("Error loading promo products for popup:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSaleItems();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('ifooty_weekly_offer_seen', 'true');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectSize = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product) => {
    const size = selectedSizes[product.id] || 'M';
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      is_sale: true
    }, size);

    setAddedMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleScrollPrev = () => {
    const el = document.getElementById('popup-deals-scroll');
    if (!el) return;
    const card = el.children[0];
    const width = card ? card.getBoundingClientRect().width + 16 : 240;
    el.scrollBy({ left: -width, behavior: 'smooth' });
  };

  const handleScrollNext = () => {
    const el = document.getElementById('popup-deals-scroll');
    if (!el) return;
    const card = el.children[0];
    const width = card ? card.getBoundingClientRect().width + 16 : 240;
    el.scrollBy({ left: width, behavior: 'smooth' });
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          background: 'linear-gradient(145deg, #101214 0%, #1a1d20 100%)',
          border: '1.5px solid rgba(214, 255, 0, 0.4)',
          borderRadius: '16px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2rem 1.75rem',
          position: 'relative',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(214, 255, 0, 0.15)',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          scrollbarWidth: 'thin'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#9CA3AF',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#9CA3AF';
          }}
          aria-label="Fechar Popup"
        >
          <X size={18} />
        </button>

        {/* Top Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingRight: '2rem', paddingLeft: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(214, 255, 0, 0.12)', border: '1px solid rgba(214, 255, 0, 0.35)', color: '#D6FF00', padding: '0.3rem 0.85rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>
            <Flame size={14} color="#D6FF00" />
            <span>{t('rb_popup_weekly_deal')}</span>
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 0.4rem 0', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {t('rb_popup_get_extra')}
          </h2>
          
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: '0 auto', maxWidth: '520px', lineHeight: 1.4 }}>
            {t('rb_popup_subtitle')}
          </p>

          {/* Coupon Mini Bar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px dashed #D6FF00',
            borderRadius: '8px',
            padding: '0.45rem 1rem',
            marginTop: '0.8rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('rb_popup_coupon_label')}
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D6FF00', letterSpacing: '1.5px' }}>
              {COUPON_CODE}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                background: copied ? '#10B981' : '#D6FF00',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '0.35rem 0.75rem',
                fontWeight: 800,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? <><Check size={12} /> {t('rb_popup_copied')}</> : <><Copy size={12} /> {t('rb_popup_copy')}</>}
            </button>
          </div>
        </div>

        {/* Carousel Header & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.2rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ffffff' }}>
            {t('rb_popup_selected_promos')} ({saleProducts.length})
          </span>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={handleScrollPrev}
              style={{
                background: '#202428',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#D6FF00'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#202428'; e.currentTarget.style.color = '#fff'; }}
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleScrollNext}
              style={{
                background: '#202428',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#D6FF00'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#202428'; e.currentTarget.style.color = '#fff'; }}
              aria-label="Próximo"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Product Carousel inside Popup */}
        <div 
          id="popup-deals-scroll"
          style={{ 
            display: 'flex', 
            gap: '1rem', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            padding: '0.4rem 0.2rem 1rem 0.2rem',
            scrollBehavior: 'smooth'
          }}
        >
          {saleProducts.map((product) => {
            const currentSize = selectedSizes[product.id] || 'M';
            const isAdded = !!addedMap[product.id];
            const sizeAddon = getSizeAddon(currentSize);
            const currentPrice = product.price + sizeAddon;
            const currentOldPrice = product.oldPrice + sizeAddon;
            const discountPercent = Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100);

            return (
              <div 
                key={product.id}
                style={{
                  flex: '0 0 240px',
                  scrollSnapAlign: 'start',
                  background: '#141618',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Image & Discount Badge */}
                <div style={{ position: 'relative', height: '170px', background: '#0B0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#EF4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    zIndex: 2
                  }}>
                    -{discountPercent}%
                  </span>

                  <img 
                    src={product.image} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.6rem' }} 
                  />
                </div>

                {/* Product Info & Size Selection */}
                <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>
                      {product.category}
                    </span>
                    <h4 style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, margin: '0.2rem 0 0.5rem 0', lineHeight: 1.3, height: '2.2rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {formatProductName(product.name)}
                    </h4>

                    {/* Price Row (Dynamic based on selected size) */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#D6FF00', fontSize: '1.05rem', fontWeight: 900 }}>
                        ${currentPrice.toFixed(2)} CAD
                      </span>
                      <span style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'line-through', fontWeight: 600 }}>
                        ${currentOldPrice.toFixed(2)}
                      </span>
                      {sizeAddon > 0 && (
                        <span style={{ fontSize: '0.62rem', color: '#D6FF00', background: 'rgba(214,255,0,0.12)', border: '1px solid rgba(214,255,0,0.25)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                          +{currentSize} (+$ {sizeAddon.toFixed(2)})
                        </span>
                      )}
                    </div>

                    {/* Size Selector */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                        {t('rb_cat_size')}: <strong style={{ color: '#fff' }}>{currentSize}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {SIZES.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSelectSize(product.id, s)}
                            style={{
                              background: currentSize === s ? '#D6FF00' : 'rgba(255,255,255,0.06)',
                              color: currentSize === s ? '#000000' : '#ffffff',
                              border: currentSize === s ? '1px solid #D6FF00' : '1px solid rgba(255,255,255,0.12)',
                              borderRadius: '3px',
                              padding: '0.15rem 0.4rem',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={{
                      width: '100%',
                      background: isAdded ? '#10B981' : '#D6FF00',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.55rem',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} /> {t('rb_popup_added')}
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} /> {t('rb_popup_add')} ({currentSize})
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
            {t('rb_popup_disclaimer')}
          </span>

          <button
            onClick={() => {
              handleClose();
              navigate('/colecao/sale');
            }}
            style={{
              background: 'transparent',
              color: '#D6FF00',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer'
            }}
          >
            {t('rb_popup_view_all')} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default WeeklyOfferPopup;
