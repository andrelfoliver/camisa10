import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Star, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RefreshCw, Calendar, Heart, Share2, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatProductName } from '../utils/format';

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
  const { addToCart } = useCart();
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
              rating: data.rating || 4.8,
              reviews: data.reviews_count || 32,
              colors: ['#000000', '#ffffff', '#e31837'],
              desc: data.description || 'Premium stitched sports jersey. Features authentic player details, breathable mesh elements, and lightweight tailored design for maximum performance and look.'
            });
            setSelectedColor('#000000');
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
    
    const extras = {
      nameNumber: nameNumberEnabled,
      customName: nameNumberEnabled ? customName.toUpperCase() : '',
      customNumber: nameNumberEnabled ? customNumber : '',
      patch: false,
      extraCustomization: false,
      onlyShirt: false
    };

    addToCart({
      id: id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      color: selectedColor
    }, selectedSize, extras);
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

  return (
    <div style={{ background: '#ffffff', padding: '3rem 2rem' }} className="rebrand-scope">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Back Link & Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rebrand-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <ArrowLeft size={14} /> Back to Catalog
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', fontWeight: 600 }}>
            Home / {product.category.toUpperCase()} / {formatProductName(product.name)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '5rem' }}>
          
          {/* Left Column: Product Image & Badges */}
          <div>
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              aspectRatio: '1', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid var(--rebrand-border)',
              position: 'relative',
              boxShadow: 'var(--rebrand-shadow-sm)'
            }}>
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
                100% Stitched
              </span>
              <img src={product.image} alt={product.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
            </div>
            
            {/* Shipping Info Card (Fanatics Style) */}
            <div style={{
              marginTop: '2rem',
              background: 'var(--rebrand-surface)',
              borderRadius: '6px',
              padding: '1.5rem',
              border: '1px solid var(--rebrand-border)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '1rem',
              alignItems: 'start'
            }}>
              <Truck size={24} color="#2b8a3e" style={{ marginTop: '2px' }} />
              <div>
                <h5 style={{ margin: '0 0 0.2rem 0', color: '#2b8a3e', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>✓ Ready To Ship</h5>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', lineHeight: 1.5 }}>
                  This item leaves our warehouse in 1-2 business days. Eligible for free Canada-wide shipping on orders over $99 CAD.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Prices, Colors, Customization */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '0.5rem', display: 'block' }}>
                Official {product.category} Merchandise
              </span>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
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
            </div>

            <h1 style={{ fontSize: '3rem', lineHeight: '0.9', margin: '0 0 1rem 0', color: 'var(--rebrand-text-main)' }}>
              {formatProductName(product.name)}
            </h1>
            
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

            {/* Price Box Fanatics Style */}
            <div style={{ 
              background: '#F1F3F5', 
              padding: '1.2rem', 
              borderRadius: '4px', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'baseline',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: product.oldPrice ? '#dc3545' : 'var(--rebrand-text-main)' }}>
                ${product.price.toFixed(2)} CAD
              </span>
              {product.oldPrice && (
                <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--rebrand-text-muted)' }}>
                  Reg. ${product.oldPrice.toFixed(2)}
                </span>
              )}
              <span style={{ 
                background: product.oldPrice ? '#dc3545' : '#121416', 
                color: '#ffffff', 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                padding: '0.2rem 0.6rem', 
                borderRadius: '2px', 
                textTransform: 'uppercase',
                marginLeft: 'auto'
              }}>
                {product.oldPrice ? 'Sale' : 'Special Event Item'}
              </span>
            </div>

            {/* Colors Selection */}
            {product.colors && product.colors.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ fontSize: '0.85rem', marginBottom: '0.8rem', color: 'var(--rebrand-text-main)', textTransform: 'uppercase', fontWeight: 800 }}>Available Colors</h5>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  {product.colors.map(col => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: col,
                        border: selectedColor === col ? '3px solid #121416' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        transform: selectedColor === col ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.1s'
                      }}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Selection with Size Chart */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--rebrand-text-main)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>Select Size</h5>
                <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-volt)', textShadow: '1px 1px 0px #000', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>Size Chart</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '4px',
                      border: `2px solid ${selectedSize === size ? '#121416' : 'var(--rebrand-border)'}`,
                      background: selectedSize === size ? '#121416' : '#ffffff',
                      color: selectedSize === size ? '#ffffff' : 'var(--rebrand-text-main)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Stitched Personalization */}
            <div style={{
              background: 'var(--rebrand-surface)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--rebrand-border)',
              marginBottom: '2.5rem'
            }}>
              <div 
                onClick={() => setNameNumberEnabled(!nameNumberEnabled)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', marginBottom: nameNumberEnabled ? '1.5rem' : 0 }}
              >
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '4px', 
                  border: '2px solid var(--rebrand-text-main)',
                  background: nameNumberEnabled ? 'var(--rebrand-text-main)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {nameNumberEnabled && <span style={{ color: 'var(--rebrand-volt)', fontWeight: 800, fontSize: '0.7rem' }}>✓</span>}
                </div>
                <div>
                  <h6 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--rebrand-text-main)', fontWeight: 800, textTransform: 'uppercase' }}>Add Custom Name & Number</h6>
                  <span style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)' }}>Stitched custom detailing (+ $11.90 CAD)</span>
                </div>
              </div>

              {nameNumberEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--rebrand-text-muted)', marginBottom: '0.3rem', fontWeight: 700 }}>Player Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MAHOMES" 
                      value={customName}
                      onChange={e => setCustomName(e.target.value.substring(0, 15))}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--rebrand-border)', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--rebrand-text-muted)', marginBottom: '0.3rem', fontWeight: 700 }}>Number</label>
                    <input 
                      type="text" 
                      placeholder="15" 
                      value={customNumber}
                      onChange={e => setCustomNumber(e.target.value.replace(/\D/g, '').substring(0, 2))}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--rebrand-border)', borderRadius: '4px', textAlign: 'center', fontWeight: 800 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart CTA */}
            <button 
              onClick={handleAddToCart}
              className="rebrand-btn rebrand-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '1.2rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.8rem', 
                fontSize: '1rem',
                background: '#121416',
                color: '#ffffff',
                borderColor: '#121416'
              }}
            >
              <ShoppingBag size={20} color="var(--rebrand-volt)" /> Add Jersey to Bag
            </button>

            {/* Quality & Return Assurances */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem', 
              marginTop: '3rem', 
              borderTop: '1px solid var(--rebrand-border)', 
              paddingTop: '2rem',
              textAlign: 'center'
            }}>
              <div>
                <ShieldCheck size={24} color="#2b8a3e" style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>100% Authentic</span>
              </div>
              <div>
                <RefreshCw size={24} color="#2b8a3e" style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>90-Day Returns</span>
              </div>
              <div>
                <Calendar size={24} color="#2b8a3e" style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>Fast Shipping</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductPage;
