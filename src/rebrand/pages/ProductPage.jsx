import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { Star, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RefreshCw, Calendar, Heart, Share2, Info, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatProductName } from '../utils/format';
import SizeGuideModal from '../../components/SizeGuideModal';

// Todos os mocks para busca rápida com suporte a cores de time, preços riscados e informações extras
const ALL_MOCKS = {
  'mock-1': { name: 'Toronto Raptors Statement Edition Jersey', price: 139.90, oldPrice: 179.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', rating: 4.9, reviews: 142, colors: ['#CE1141', '#000000', '#FFFFFF'], desc: 'Rep your team in comfort with the Toronto Raptors Statement Edition Jersey. Stitching details and sweat-wicking double-knit fabric help keep you dry and comfortable whether you are playing a pickup game or styling on the streets.' },
  'mock-2': { name: 'Toronto Maple Leafs Home Primegreen Jersey', price: 149.90, oldPrice: 189.90, category: 'Hockey', image: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800', rating: 4.8, reviews: 98, colors: ['#00205B', '#FFFFFF'], desc: 'Stand tall with the Maple Leafs in the official NHL Home Primegreen Jersey. Made with high-performance recycled materials, it features a tailored hockey fit and stitched team crest to replicate the look and feel of the pros on ice.' },
  'mock-3': { name: 'Toronto Blue Jays Replica Cool Base Jersey', price: 129.90, oldPrice: 159.90, category: 'Baseball', image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800', rating: 4.7, reviews: 76, colors: ['#132B5C', '#1D2D5C', '#FFFFFF'], desc: 'Support Canadas MLB powerhouse with the Toronto Blue Jays Replica Jersey. Cool Base technology offers moisture-wicking fabric for a lightweight, breathable feel during hot summer afternoons at the ballpark.' },
  'mock-4': { name: 'Kansas City Chiefs Patrick Mahomes Game Jersey', price: 139.90, oldPrice: 179.90, category: 'Football', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800', rating: 5.0, reviews: 310, colors: ['#E31837', '#FFB81C', '#FFFFFF'], desc: 'Showcase your football pride with the Patrick Mahomes Kansas City Chiefs Game Jersey. Designed for movement with mesh side panels for extra breathability, this jersey features clean silicone print numbers and stitched nameplates.' },
  'bask-1': { name: 'Toronto Raptors Statement Edition Jersey', price: 139.90, oldPrice: 179.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', rating: 4.9, reviews: 142, colors: ['#CE1141', '#000000', '#FFFFFF'], desc: 'Statement Edition stitched jersey.' },
  'bask-2': { name: 'Los Angeles Lakers LeBron James Icon Jersey', price: 139.90, oldPrice: 179.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800', rating: 4.8, reviews: 204, colors: ['#552583', '#FDB927', '#FFFFFF'], desc: 'Stitched LeBron James Lakers jersey.' },
  'bask-3': { name: 'Golden State Warriors Stephen Curry Association Jersey', price: 139.90, oldPrice: 169.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=800', rating: 4.9, reviews: 188, colors: ['#1D428A', '#FFC72C', '#FFFFFF'], desc: 'Stitched Stephen Curry Warriors jersey.' },
  'foot-1': { name: 'Kansas City Chiefs Patrick Mahomes Game Jersey', price: 139.90, oldPrice: 179.90, category: 'Football', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800', rating: 5.0, reviews: 310, colors: ['#E31837', '#FFB81C', '#FFFFFF'], desc: 'Stitched Patrick Mahomes Chiefs jersey.' },
  'foot-2': { name: 'Dallas Cowboys Dak Prescott Navy Jersey', price: 139.90, oldPrice: 169.90, category: 'Football', image: 'https://images.unsplash.com/photo-1614036417651-efe5912149d8?w=800', rating: 4.6, reviews: 92, colors: ['#003594', '#869397', '#FFFFFF'], desc: 'Stitched Dak Prescott Cowboys jersey.' },
  'base-1': { name: 'Toronto Blue Jays Replica Cool Base Jersey', price: 129.90, oldPrice: 159.90, category: 'Baseball', image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800', rating: 4.7, reviews: 76, colors: ['#132B5C', '#1D2D5C', '#FFFFFF'], desc: 'Stitched Blue Jays replica jersey.' },
  'base-2': { name: 'Los Angeles Dodgers Shohei Ohtani Home Jersey', price: 149.90, oldPrice: 189.90, category: 'Baseball', image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800', rating: 4.9, reviews: 154, colors: ['#005A9C', '#FFFFFF'], desc: 'Stitched Shohei Ohtani Dodgers jersey.' },
  'hock-1': { name: 'Toronto Maple Leafs Home Primegreen Jersey', price: 149.90, oldPrice: 189.90, category: 'Hockey', image: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800', rating: 4.8, reviews: 98, colors: ['#00205B', '#FFFFFF'], desc: 'Stitched Maple Leafs home jersey.' },
  'hock-2': { name: 'Edmonton Oilers Connor McDavid Home Jersey', price: 149.90, oldPrice: 189.90, category: 'Hockey', image: 'https://images.unsplash.com/photo-1580748141549-71748d60bdc9?w=800', rating: 4.9, reviews: 112, colors: ['#041E42', '#FF4C00', '#FFFFFF'], desc: 'Stitched Connor McDavid Oilers jersey.' }
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, pricingConfig } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Configuração de Item
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [nameNumberEnabled, setNameNumberEnabled] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');

  // Favorito
  const [isWishlist, setIsWishlist] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isShippingOpen, setIsShippingOpen] = useState(true);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [selectedInclusions, setSelectedInclusions] = useState('full');

  useEffect(() => {
    async function loadProductDetails() {
      setLoading(true);
      if (ALL_MOCKS[id]) {
        const mock = ALL_MOCKS[id];
        setProduct(mock);
        setSelectedColor(mock.colors?.[0] || '');
        setLoading(false);
      } else {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          if (data) {
            setProduct({
              id: data.id,
              name: data.name,
              price: data.price || 89.90,
              oldPrice: (data.price || 89.90) + 20.00,
              category: 'Soccer',
              image: data.image || data.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
              gallery: data.gallery || [],
              rating: data.rating || 4.8,
              reviews: data.reviews_count || 32,
              colors: ['#000000', '#ffffff', '#e31837'],
              desc: data.description || 'Premium stitched sports jersey. Features authentic player details, breathable mesh elements, and lightweight tailored design for maximum performance and look.'
            });
            setSelectedColor('#000000');
            const isKids = data.name?.toLowerCase().includes('infantil') || data.name?.toLowerCase().includes('kids') || data.name?.toLowerCase().includes('child') || data.name?.toLowerCase().includes('bebê') || data.name?.toLowerCase().includes('baby');
            setSelectedSize(isKids ? '22' : 'M');
          }
        } catch (err) {
          console.error("Error loading DB product detail:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const finalPrice = isKidsKit 
      ? (selectedInclusions === 'shirt' 
         ? (['24', '26', '28'].includes(selectedSize) ? 42.90 : 37.90) 
         : (['24', '26', '28'].includes(selectedSize) ? 54.90 : 49.90))
      : product.price;

    const extras = {
      nameNumber: nameNumberEnabled,
      customName: nameNumberEnabled ? customName.toUpperCase() : '',
      customNumber: nameNumberEnabled ? customNumber : '',
      patch: false,
      extraCustomization: false,
      onlyShirt: isKidsKit && selectedInclusions === 'shirt'
    };

    addToCart({
      id: id,
      name: product.name + (isKidsKit ? ` - Size ${selectedSize} (${selectedInclusions === 'shirt' ? 'Shirt Only' : 'Full Kit'})` : ''),
      price: finalPrice,
      image: product.image,
      category: product.category,
      color: selectedColor
    }, selectedSize, extras, quantity);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem 0' }} className="rebrand-scope">
        <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>Loading official fan gear details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem 0' }} className="rebrand-scope">
        <h3 style={{ color: 'var(--rebrand-text-muted)' }}>Jersey Not Found</h3>
        <button onClick={() => navigate('/rebrand')} className="rebrand-btn rebrand-btn-primary" style={{ marginTop: '2rem' }}>
          Back to Shop
        </button>
      </div>
    );
  }

  const isKidsKit = 
    product?.name?.toLowerCase().includes('infantil') || 
    product?.name?.toLowerCase().includes('kids') ||
    product?.name?.toLowerCase().includes('child') ||
    product?.name?.toLowerCase().includes('bebê') ||
    product?.name?.toLowerCase().includes('baby');

  const isPlayerVersion = 
    !isKidsKit && (
      product?.name?.toLowerCase().includes('player') || 
      product?.name?.toLowerCase().includes('jogador') ||
      product?.desc?.toLowerCase().includes('player version') ||
      product?.desc?.toLowerCase().includes('versão jogador')
    );

  const availableSizes = isKidsKit
    ? ['16', '18', '20', '22', '24', '26', '28']
    : (isPlayerVersion 
      ? ['S', 'M', 'L', 'XL', '2XL'] 
      : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']);

  return (
    <div style={{ background: '#ffffff', padding: '1.5rem 2rem 4rem' }} className="rebrand-scope">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <div className="rebrand-product-breadcrumb-container" style={{ marginBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6c757d', background: 'transparent', border: 'none', padding: '0.2rem 0', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back to Catalog
          </button>
        </div>

        <div className="rebrand-product-grid">
              {/* Left Column: Product Image & Gallery */}
          <div>
            {(() => {
              const images = [product.image, ...(product.gallery || [])].filter(Boolean);
              return (
                <div className="rebrand-product-gallery">
                  {/* Vertical Thumbnails */}
                  <div className="rebrand-product-thumbnails">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveThumb(idx)}
                        className={`rebrand-product-thumbnail-btn ${activeThumb === idx ? 'active' : ''}`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          style={{ objectFit: 'contain' }} 
                        />
                      </button>
                    ))}
                  </div>

                  {/* Main Product Image */}
                  <div className="rebrand-product-main-image-container">
                    <span style={{
                      position: 'absolute',
                      top: '1.5rem',
                      left: '1.5rem',
                      background: '#121416',
                      color: '#ffffff',
                      padding: '0.4rem 1rem',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      borderRadius: '3px',
                      borderLeft: '3px solid var(--rebrand-volt)',
                      zIndex: 2
                    }}>
                      Premium Quality
                    </span>

                    {/* Left Navigation Arrow */}
                    {images.length > 1 && (
                      <button 
                        onClick={() => setActiveThumb(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                        style={{
                          position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                          background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '50%',
                          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', transition: 'all 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <ChevronLeft size={20} color="#121416" />
                      </button>
                    )}

                    <img 
                      src={images[activeThumb] || product.image} 
                      alt={product.name} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain'
                      }} 
                    />

                    {/* Right Navigation Arrow */}
                    {images.length > 1 && (
                      <button 
                        onClick={() => setActiveThumb(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                        style={{
                          position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                          background: '#ffffff', border: '1px solid #dee2e6', borderRadius: '50%',
                          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', transition: 'all 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <ChevronRight size={20} color="#121416" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Title, Prices, Colors, Customization */}
          <div style={{ position: 'relative', paddingTop: '0.5rem' }}>
            {/* Wishlist & Share Buttons (Absolute to not take vertical space) */}
            <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: '0.8rem', zIndex: 10 }}>
              <button 
                onClick={() => setIsWishlist(!isWishlist)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isWishlist ? '#dc3545' : 'var(--rebrand-text-muted)' }}
                title="Add to Wishlist"
              >
                <Heart size={20} fill={isWishlist ? '#dc3545' : 'transparent'} />
              </button>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--rebrand-text-muted)' }} title="Share Product">
                <Share2 size={20} />
              </button>
            </div>

            <h1 className="rebrand-product-detail-title" style={{ marginTop: 0, marginBottom: '0.2rem', paddingRight: '4rem' }}>
              {formatProductName(product.name)}
            </h1>
            
            <p style={{ margin: '0 0 1.5rem 0', color: '#2b8a3e', fontWeight: 700, fontSize: '0.9rem' }}>
              {product.badge || 'Special Event Item'}
            </p>
            
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', color: '#FFB100' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} fill={i < Math.floor(product.rating) ? "#FFB100" : "transparent"} color="#FFB100" />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--rebrand-text-main)' }}>{product.rating}</span>
              <span style={{ color: 'var(--rebrand-text-muted)', fontSize: '0.85rem' }}>({product.reviews} customer reviews)</span>
            </div>

            {/* Price (Fanatics Style: Clean & Inline) */}
            {(() => {
              const customFee = nameNumberEnabled ? (pricingConfig?.nameNumber || 11.90) : 0;
              let basePrice = product.price;
              
              if (isKidsKit) {
                if (selectedInclusions === 'shirt') {
                  basePrice = ['24', '26', '28'].includes(selectedSize) ? 42.90 : 37.90;
                } else {
                  basePrice = ['24', '26', '28'].includes(selectedSize) ? 54.90 : 49.90;
                }
              }

              const sizeFee = (!isKidsKit && ['2XL', '3XL'].includes(selectedSize))
                ? (pricingConfig?.size2XL3XL || 7.00) 
                : (!isKidsKit && selectedSize === '4XL' ? (pricingConfig?.size4XL || 10.00) : 0);
              const totalAddons = customFee + sizeFee;
              const currentPrice = basePrice + totalAddons;
              const regPrice = isKidsKit 
                ? (selectedInclusions === 'shirt' 
                   ? (['24', '26', '28'].includes(selectedSize) ? 79.90 : 69.90) 
                   : (['24', '26', '28'].includes(selectedSize) ? 104.90 : 89.90)) + totalAddons
                : (product.oldPrice ? product.oldPrice + totalAddons : null);

              return (
                <div style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--rebrand-text-muted)', textTransform: 'uppercase' }}>Your Price:</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc3545' }}>
                    ${currentPrice.toFixed(2)} CAD
                  </span>
                  {regPrice && (
                    <>
                      <span style={{ fontSize: '0.95rem', textDecoration: 'line-through', color: 'var(--rebrand-text-muted)' }}>
                        Reg. ${regPrice.toFixed(2)}
                      </span>
                      <span style={{ 
                        background: '#dc3545', color: '#fff', fontSize: '0.75rem', 
                        fontWeight: 800, padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' 
                      }}>
                        Save ${(((regPrice - currentPrice) / regPrice) * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
              );
            })()}


            {/* Sizes Selection with Size Chart (Fanatics Style) */}
            <div className="rebrand-size-header-bar" style={{ marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>Size</span>
              <span 
                onClick={() => setIsSizeGuideOpen(true)}
                style={{ fontSize: '0.8rem', color: '#121416', textDecoration: 'underline', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Size Chart
              </span>
            </div>
            
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rebrand-size-btn-fanatics ${selectedSize === size ? 'active' : ''}`}
                    style={{ height: '40px', minWidth: '0' }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {isKidsKit && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#121416', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Included Items</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedInclusions('full')}
                    style={{
                      height: '40px',
                      background: selectedInclusions === 'full' ? 'rgba(43,138,62,0.08)' : '#fff',
                      border: selectedInclusions === 'full' ? '2px solid #2b8a3e' : '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: selectedInclusions === 'full' ? '#2b8a3e' : '#495057',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    Full Kit (Shirt + Shorts)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInclusions('shirt')}
                    style={{
                      height: '40px',
                      background: selectedInclusions === 'shirt' ? 'rgba(43,138,62,0.08)' : '#fff',
                      border: selectedInclusions === 'shirt' ? '2px solid #2b8a3e' : '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: selectedInclusions === 'shirt' ? '#2b8a3e' : '#495057',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    Shirt Only
                  </button>
                </div>
              </div>
            )}

            {/* Custom Stitched Personalization (Compact) */}
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              marginBottom: '1.5rem'
            }}>
              <div 
                onClick={() => setNameNumberEnabled(!nameNumberEnabled)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: nameNumberEnabled ? '1rem' : 0 }}
              >
                <div style={{ 
                  width: '18px', height: '18px', borderRadius: '3px', border: '2px solid #121416',
                  background: nameNumberEnabled ? '#121416' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}>
                  {nameNumberEnabled && <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.6rem' }}>✓</span>}
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700 }}>Add Custom Name & Number</span>
                  <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '0.4rem' }}>
                    (+ ${(pricingConfig?.nameNumber || 11.90).toFixed(2)} CAD)
                  </span>
                </div>
              </div>

              {nameNumberEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Player Name (e.g. MAHOMES)" 
                    value={customName}
                    onChange={e => setCustomName(e.target.value.substring(0, 15))}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}
                  />
                  <input 
                    type="text" 
                    placeholder="Number (e.g. 15)" 
                    value={customNumber}
                    onChange={e => setCustomNumber(e.target.value.replace(/\D/g, '').substring(0, 2))}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}
                  />
                </div>
              )}
            </div>

            {/* Quantity and Add to Cart Row */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#121416', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Quantity</span>
                <select 
                  value={quantity} 
                  onChange={e => setQuantity(Number(e.target.value))}
                  style={{ 
                    height: '48px', padding: '0 1rem', borderRadius: '6px', 
                    border: '1px solid #ced4da', background: '#fff', 
                    fontSize: '1rem', fontWeight: 600, color: '#121416', cursor: 'pointer', outline: 'none'
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleAddToCart}
                  className="rebrand-btn rebrand-btn-primary" 
                  style={{ 
                    width: '100%', height: '48px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', 
                    fontSize: '1rem', background: '#121416', color: '#ffffff', border: 'none', borderRadius: '100px'
                  }}
                >
                  <ShoppingBag size={18} color="var(--rebrand-volt)" /> Add to Cart
                </button>
              </div>
            </div>

            {/* Shipping Accordion (Fanatics style) */}
            <div style={{ borderTop: '1px solid #dee2e6' }}>
              <div 
                onClick={() => setIsShippingOpen(!isShippingOpen)}
                style={{ padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#121416' }}>Shipping</span>
                <span style={{ fontWeight: 850, fontSize: '1.2rem', color: '#121416', userSelect: 'none' }}>{isShippingOpen ? '−' : '+'}</span>
              </div>
              {isShippingOpen && (
                <div style={{ paddingBottom: '1rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                  <Truck size={18} color="#121416" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.8rem', color: '#495057', lineHeight: 1.6 }}>
                    <li style={{ marginBottom: '0.3rem' }}>This item leaves our warehouse in 1-3 business days.</li>
                    <li style={{ marginBottom: '0.3rem' }}><strong>✓ Ready To Ship</strong> immediately upon processing.</li>
                    <li>Eligible for <strong>free Canada-wide shipping</strong> on orders over $99 CAD.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Description Accordion */}
            <div style={{ borderTop: '1px solid #dee2e6' }}>
              <div 
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                style={{ padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#121416' }}>Description</span>
                <span style={{ fontWeight: 850, fontSize: '1.2rem', color: '#121416', userSelect: 'none' }}>{isDescriptionOpen ? '−' : '+'}</span>
              </div>
              {isDescriptionOpen && (
                <div style={{ paddingBottom: '1rem', fontSize: '0.85rem', color: '#495057', lineHeight: 1.6 }}>
                  {product.desc}
                </div>
              )}
            </div>

            {/* Quality & Return Assurances */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem', 
              marginTop: '1.5rem', 
              borderTop: '1px solid var(--rebrand-border)', 
              paddingTop: '1.5rem',
              textAlign: 'center'
            }}>
              <div>
                <Award size={24} color="#2b8a3e" style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>Premium Quality</span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--rebrand-text-muted)', marginTop: '0.2rem' }}>High-grade fabrics</span>
              </div>
              <div>
                <ShieldCheck size={24} color="#2b8a3e" style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>Defect Warranty</span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--rebrand-text-muted)', marginTop: '0.2rem' }}>100% factory covered</span>
              </div>
              <div>
                <Calendar size={24} color="#2b8a3e" style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>Fast Shipping</span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--rebrand-text-muted)', marginTop: '0.2rem' }}>With tracking number</span>
              </div>
            </div>

          </div>

        </div>

        <SizeGuideModal 
          isOpen={isSizeGuideOpen} 
          onClose={() => setIsSizeGuideOpen(false)} 
          isNba={product?.category?.toLowerCase() === 'basketball'} 
          isRebrand={true}
        />
      </div>
    </div>
  );
};

export default ProductPage;
