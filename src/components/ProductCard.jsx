import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { translateProductDisplay, language } = useLanguage();
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
      {/* Badges Container - Evita a sobreposição fixando uma coluna no topo esquerdo */}
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
        {product.version && (
          <div className="badge" style={{ 
            position: 'relative',
            top: 0,
            left: 0,
            background: 'rgba(255,255,255,0.1)', 
            color: 'var(--text-muted)',
            fontSize: '0.65rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {translateProductDisplay(product.version)}
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
        <img 
          src={imageError ? '/camisas/placeholder.png' : product.image} 
          alt={product.name} 
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.4))' }} 
          onError={() => setImageError(true)}
        />
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
          ${product.price ? product.price.toFixed(2) : '47.90'} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>CAD</span>
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
