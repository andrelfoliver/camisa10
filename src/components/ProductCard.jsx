import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';
import ProductMedia from './ProductMedia';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { translateProductDisplay, language, t, formatPrice } = useLanguage();
  const [selectedSize, setSelectedSize] = useState('M');
  const [imageError, setImageError] = useState(false);
  const sizes = ['S', 'M', 'L', 'XL'];

  // if (imageError) return null; // Removido: agora mostramos o placeholder em vez de esconder o produto

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, selectedSize);
  };

  const handleView = () => {
    navigate(`/produto/${product.id}`);
  };

  const hasLocalStock = product.inventory && Object.values(product.inventory).some(qty => qty > 0);

  return (
    <div className="glass-panel" style={{ 
      position: 'relative',
      borderRadius: 'var(--radius-md)', 
      overflow: 'hidden',
      transition: 'var(--transition)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Badge Container - Marketing (Top Left) */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        left: '1rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start',
        gap: '0.4rem', 
        zIndex: 20,
        pointerEvents: 'none' 
      }}>
        {product.is_bestseller && (
          <div className="badge" style={{ position: 'relative', top: 0, left: 0, background: '#EF4444', color: '#fff', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {t('section_best_seller')}
          </div>
        )}
        {product.is_new && !product.is_bestseller && (
          <div className="badge" style={{ position: 'relative', top: 0, left: 0, background: '#FFB81C', color: '#000' }}>
            {t('section_new')}
          </div>
        )}
      </div>

      <div 
        onClick={handleView}
        style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: '200px',
          cursor: 'pointer',
          position: 'relative'
        }}
        className="product-card-img-container hover-zoom"
      >
        <ProductMedia
          src={imageError ? '/camisas/placeholder.png' : product.image} 
          alt={product.name} 
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.4))' }} 
          onError={() => setImageError(true)}
        />
        {hasLocalStock && (
          <div 
            className="pulse-soft"
            style={{ 
              position: 'absolute', 
              bottom: '8px', 
              left: '8px', 
              background: 'var(--accent-color)', 
              color: '#000', 
              fontSize: '0.65rem', 
              fontWeight: 900, 
              padding: '2px 6px', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              zIndex: 30
            }}
          >
            ⚡ {language === 'pt' ? 'PRONTA ENTREGA' : 'IN STOCK'}
          </div>
        )}
        {imageError && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', textAlign: 'center', fontWeight: 800, zIndex: 10 }}>
            {language === 'pt' ? '🖼️ LINK DA IMAGEM QUEBRADO' : '🖼️ BROKEN IMAGE LINK'}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', padding: '0.4rem', borderRadius: '50%', color: '#fff' }}>
          <Eye size={14} />
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {language === 'pt' ? product.category : product.category?.replace('Seleção Brasileira', 'National Team')}
        </span>
        <h3 
          onClick={handleView}
          style={{ fontSize: '1rem', cursor: 'pointer', marginBottom: '0.25rem', fontFamily: 'var(--font-body)', fontWeight: 600, lineHeight: 1.2 }}
          className="hover-underline"
        >
          {translateProductDisplay(product.name)}
        </h3>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
          {formatPrice(
            (product.category?.toLowerCase().includes('infantil') ||
             product.name?.toLowerCase().includes('infantil') ||
             product.name?.toLowerCase().includes('kids'))
              ? 49.90
              : (product.price || 47.90)
          )}
        </span>
        
        <div style={{ marginTop: 'auto' }}>
          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleView}
          >
            {t('product_buy_now')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
