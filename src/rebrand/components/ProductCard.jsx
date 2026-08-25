import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Star } from 'lucide-react';
import { formatProductName } from '../utils/format';
import { useLanguage } from '../../context/LanguageContext';

const ProductCard = ({ product, onAdd, onQuickView }) => {
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || '');
  const { t } = useLanguage();

  const getBadgeLabel = (badge) => {
    if (!badge) return '';
    const b = badge.toLowerCase().trim();
    if (b.includes('new') || b.includes('lançamento') || b.includes('novedad')) return t('rb_badge_new_arrival');
    if (b.includes('best') || b.includes('top') || b.includes('vendido')) return t('rb_badge_best_seller');
    if (b.includes('sale') || b.includes('promo')) return t('rb_badge_sale');
    if (b.includes('almost') || b.includes('pouca') || b.includes('poca')) return t('rb_badge_almost_gone');
    if (b.includes('popular') || b.includes('trending') || b.includes('alta')) return t('rb_badge_trending');
    return badge;
  };

  const getCategoryLabel = (cat) => {
    if (!cat) return '';
    const c = cat.toLowerCase();
    if (c.includes('soccer') || c === 'futebol' || c === 'fútbol') return t('rb_sport_soccer');
    if (c.includes('bask') || c === 'nba' || c === 'basquete' || c === 'baloncesto') return t('rb_sport_basketball');
    if (c.includes('foot') || c === 'nfl' || c === 'futebol americano') return t('rb_sport_football');
    if (c.includes('base') || c === 'mlb' || c === 'beisebol' || c === 'béisbol') return t('rb_sport_baseball');
    if (c.includes('hock') || c === 'nhl' || c === 'hóquei' || c === 'hockey') return t('rb_sport_hockey');
    return cat;
  };

  return (
    <div className="rebrand-product-card">
      <div className="rebrand-product-img-wrapper">
        {product.badge && (
          <span className={product.badge.toLowerCase().includes('almost') ? "rebrand-product-badge-red" : "rebrand-product-badge"}>
            {getBadgeLabel(product.badge)}
          </span>
        )}
        <Link to={`/produto/${product.id}`}>
          <img src={product.image} alt={product.name} className="rebrand-product-img" />
        </Link>
        
        {/* Hover Actions */}
        <div className="rebrand-product-actions">
          <button onClick={() => onAdd(product)} className="rebrand-product-btn-quick">
            <ShoppingBag size={14} style={{ marginRight: '0.4rem' }} /> {t('rb_prod_add_to_cart')}
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
        <span className="rebrand-product-category">{getCategoryLabel(product.category)}</span>

        <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none' }}>
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
          {t('rb_prod_free_shipping_eligible')}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
