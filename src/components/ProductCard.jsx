import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('M');
  const [imageError, setImageError] = useState(false);
  const sizes = ['S', 'M', 'L', 'XL'];

  if (imageError) return null; // Graceful degradation

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
      {product.id === 1 && <div className="badge">🇧🇷 Sucesso</div>}
      {product.id === 2 && <div className="badge" style={{background: '#EF4444', color: '#fff'}}>🔥 Mais Vendido</div>}
      {product.id === 3 && <div className="badge" style={{background: '#FFB81C', color: '#000'}}>⭐ Novo</div>}
      {product.version && (
        <div className="badge" style={{ 
          top: product.id <= 3 ? '40px' : '15px', 
          background: 'rgba(255,255,255,0.1)', 
          color: 'var(--text-muted)',
          fontSize: '0.65rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {product.version}
        </div>
      )}

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
          src={product.image} 
          alt={product.name} 
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.4))' }} 
          onError={() => setImageError(true)}
        />
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', padding: '0.4rem', borderRadius: '50%', color: '#fff' }}>
          <Eye size={14} />
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {product.category}
        </span>
        <h3 
          onClick={handleView}
          style={{ fontSize: '1rem', cursor: 'pointer', marginBottom: '0.25rem', fontFamily: 'var(--font-body)', fontWeight: 600, lineHeight: 1.2 }}
          className="hover-underline"
        >
          {product.name}
        </h3>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
          ${product.price ? product.price.toFixed(2) : '69.90'} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>CAD</span>
        </span>
        
        <div style={{ marginTop: 'auto' }}>
          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleView}
          >
            Personalizar e Comprar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
