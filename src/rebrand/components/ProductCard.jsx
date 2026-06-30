import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Star } from 'lucide-react';
import { formatProductName } from '../utils/format';

const ProductCard = ({ product, onAdd, onQuickView }) => {
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || '');

  return (
    <div className="rebrand-product-card">
      <div className="rebrand-product-img-wrapper">
        {product.badge && (
          <span className={product.badge.toLowerCase().includes('almost') ? "rebrand-product-badge-red" : "rebrand-product-badge"}>
            {product.badge}
          </span>
        )}
        <Link to={`/rebrand/produto/${product.id}`}>
          <img src={product.image} alt={product.name} className="rebrand-product-img" />
        </Link>
        
        {/* Hover Actions */}
        <div className="rebrand-product-actions">
          <button onClick={() => onAdd(product)} className="rebrand-product-btn-quick">
            <ShoppingBag size={14} style={{ marginRight: '0.4rem' }} /> Add to Cart
          </button>
          <button 
            onClick={() => onQuickView(product.id)}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              padding: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rebrand-text-main)'
            }}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <div className="rebrand-product-info">
        <span className="rebrand-product-category">{product.category}</span>

        <Link to={`/rebrand/produto/${product.id}`} style={{ textDecoration: 'none' }}>
          <h4 className="rebrand-product-title">{formatProductName(product.name)}</h4>
        </Link>

        <div className="rebrand-product-price-row">
          <div className="rebrand-price-container">
            <span className={`rebrand-product-price ${product.oldPrice ? 'rebrand-price-sale' : ''}`}>
              ${product.price.toFixed(2)} CAD
            </span>
            {product.oldPrice && (
              <span className="rebrand-price-old">${product.oldPrice.toFixed(2)}</span>
            )}
          </div>
          <span className="rebrand-product-rating">
            <Star size={13} fill="#FFB100" color="#FFB100" /> {product.rating}
          </span>
        </div>
        
        <span style={{ fontSize: '0.65rem', color: '#2b8a3e', fontWeight: 800, marginTop: '0.4rem', display: 'block', textTransform: 'uppercase' }}>
          ✓ Free Shipping Eligible
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
