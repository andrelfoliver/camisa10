import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowRight, Star, ShoppingBag, Eye, ShieldCheck, Truck, RefreshCw, BadgeAlert, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

// Mocks premium de outros esportes para simular a loja multiesportiva antes de cadastrar no banco
const MOCK_PRODUCTS = [
  {
    id: 'mock-1',
    name: 'Toronto Raptors Statement Edition Jersey',
    price: 139.90,
    oldPrice: 179.90,
    category: 'Basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
    rating: 4.9,
    reviews: 142,
    colors: ['#CE1141', '#000000', '#FFFFFF'],
    badge: 'Almost Gone'
  },
  {
    id: 'mock-2',
    name: 'Toronto Maple Leafs Home Primegreen Jersey',
    price: 149.90,
    oldPrice: 189.90,
    category: 'Hockey',
    image: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=600',
    rating: 4.8,
    reviews: 98,
    colors: ['#00205B', '#FFFFFF'],
    badge: 'Popular'
  },
  {
    id: 'mock-3',
    name: 'Toronto Blue Jays Replica Cool Base Jersey',
    price: 129.90,
    oldPrice: 159.90,
    category: 'Baseball',
    image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=600',
    rating: 4.7,
    reviews: 76,
    colors: ['#132B5C', '#FFFFFF'],
    badge: 'Best Seller'
  },
  {
    id: 'mock-4',
    name: 'Kansas City Chiefs Patrick Mahomes Game Jersey',
    price: 139.90,
    oldPrice: 179.90,
    category: 'Football',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600',
    rating: 5.0,
    reviews: 310,
    colors: ['#E31837', '#FFB81C', '#FFFFFF'],
    badge: 'Trending'
  }
];

const CAROUSEL_SLIDES = [
  {
    sport: 'Baseball',
    badge: '⚾ Summer Collection',
    title: 'BLUE JAYS JERSEYS',
    price: '$49.90 CAD',
    btnText: 'Shop MLB',
    link: '/rebrand/colecao/baseball',
    img: '/assets/rebrand/blue_jays.jpg'
  },
  {
    sport: 'Football',
    badge: '🏈 NFL Collection',
    title: 'CHIEFS JERSEYS',
    price: '$59.90 CAD',
    btnText: 'Shop NFL',
    link: '/rebrand/colecao/football',
    img: '/assets/rebrand/chiefs.jpg'
  },
  {
    sport: 'Hockey',
    badge: '🏒 NHL Collection',
    title: 'MAPLE LEAFS JERSEYS',
    price: '$59.90 CAD',
    btnText: 'Shop NHL',
    link: '/rebrand/colecao/hockey',
    img: '/assets/rebrand/maple_leafs.jpg'
  },
  {
    sport: 'Soccer',
    badge: '⚽ Club Collection',
    title: 'REAL MADRID JERSEYS',
    price: '$49.90 CAD',
    btnText: 'Shop Soccer',
    link: '/rebrand/colecao/soccer',
    img: '/assets/rebrand/real_madrid.jpg'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselSlides, setCarouselSlides] = useState(CAROUSEL_SLIDES);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  useEffect(() => {
    async function loadSpotlight() {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'season_spotlight')
          .single();
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCarouselSlides(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not load season_spotlight settings:", err);
      }
    }
    loadSpotlight();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(4);
        if (data) {
          const formatted = data.map((p, idx) => ({
            id: p.id,
            name: p.name,
            price: p.price || 89.90,
            oldPrice: idx % 2 === 0 ? (p.price || 89.90) + 20.00 : null,
            category: 'Soccer',
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
            rating: p.rating || 4.8,
            reviews: p.reviews_count || 32,
            colors: ['#000000', '#ffffff', '#e31837'],
            badge: idx % 2 === 0 ? 'Almost Gone' : ''
          }));
          setDbProducts(formatted);
        }
      } catch (err) {
        console.error("Error loading products for home:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const allProducts = [...MOCK_PRODUCTS, ...dbProducts];
  
  const filteredProducts = activeTab === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.category.toLowerCase() === activeTab.toLowerCase());

  const sportsCategories = [
    { name: 'Soccer', img: '/assets/rebrand/real_madrid.jpg', link: 'soccer', bgSize: 'auto 100%', bgPos: 'center top' },
    { name: 'Basketball', img: '/assets/rebrand/raptors.jpg', link: 'basketball', bgSize: 'auto 145%', bgPos: 'center 5%' },
    { name: 'Football', img: '/assets/rebrand/chiefs.jpg', link: 'football', bgSize: 'auto 115%', bgPos: 'center top' },
    { name: 'Baseball', img: '/assets/rebrand/blue_jays.jpg', link: 'baseball', bgSize: 'auto 115%', bgPos: 'center top' },
    { name: 'Hockey', img: '/assets/rebrand/maple_leafs.jpg', link: 'hockey', bgSize: 'auto 110%', bgPos: 'center top' }
  ];

  // Logos de Ligas (Design Redondo Premium)
  const leagueList = [
    { name: 'NHL', desc: 'Hockey', logo: '🏒', bg: '#121416', link: 'hockey' },
    { name: 'NBA', desc: 'Basketball', logo: '🏀', bg: '#0056b3', link: 'basketball' },
    { name: 'MLB', desc: 'Baseball', logo: '⚾', bg: '#ba8b00', link: 'baseball' },
    { name: 'NFL', desc: 'Football', logo: '🏈', bg: '#dc3545', link: 'football' },
    { name: 'MLS', desc: 'Soccer', logo: '⚽', bg: '#1098ad', link: 'soccer' }
  ];

  const trendingTeams = [
    { name: 'Toronto Maple Leafs', league: 'NHL', logo: '🏒' },
    { name: 'Toronto Raptors', league: 'NBA', logo: '🏀' },
    { name: 'Toronto Blue Jays', league: 'MLB', logo: '⚾' },
    { name: 'Kansas City Chiefs', league: 'NFL', logo: '🏈' },
    { name: 'Real Madrid', league: 'La Liga', logo: '⚽' },
    { name: 'Manchester City', league: 'Premier League', logo: '⚽' }
  ];

  const activeSlideData = carouselSlides[activeSlide];
  const activeSlideProducts = activeSlideData?.featuredProducts
    ? allProducts.filter(p => 
        activeSlideData.featuredProducts.split(',').map(id => id.trim().toLowerCase()).includes(p.id.toString().toLowerCase()) ||
        activeSlideData.featuredProducts.split(',').map(id => id.trim().toLowerCase()).includes(p.name.toLowerCase())
      )
    : [];

  return (
    <div style={{ background: '#ffffff' }}>

      {/* 1. HERO BANNER - PREMIUM LOCKER ROOM WIDE BANNER */}
      <section className="rebrand-hero">
        <div className="rebrand-hero-overlay"></div>

        <div className="rebrand-hero-content">
          <span style={{
            background: 'var(--rebrand-volt)',
            color: '#121416',
            fontSize: '0.75rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            padding: '0.4rem 1rem',
            borderRadius: '2px',
            letterSpacing: '1px',
            marginBottom: '1.5rem',
            display: 'inline-block'
          }}>
            🍁 High Quality Stitched Jerseys
          </span>
          <h1 className="rebrand-hero-title">
            Canada's Sports <span>Jersey</span> Store
          </h1>
          <p className="rebrand-hero-subtitle">
            Premium stitched jerseys from the world's biggest leagues. Fast shipping across Canada.
          </p>
          <div className="rebrand-hero-buttons">
            <button onClick={() => navigate('/rebrand/colecao/soccer')} className="rebrand-btn rebrand-btn-primary" style={{ background: 'var(--rebrand-volt)', color: '#000', borderColor: 'var(--rebrand-volt)' }}>
              Shop Jerseys
            </button>
          </div>
        </div>
      </section>

      {/* FAIXA DE DIFERENCIAIS / TRUST ELEMENT (Otimizado abaixo do Hero) */}
      <div className="rebrand-trustbar" style={{ 
        background: '#F8F9FA', 
        borderBottom: '1px solid var(--rebrand-border)',
        padding: '1.2rem 2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '4.5rem',
        flexWrap: 'wrap',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--rebrand-text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Check size={16} color="#2b8a3e" style={{ strokeWidth: 3 }} /> Premium Stitched Jerseys
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--rebrand-text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Truck size={18} color="#2b8a3e" /> Fast Shipping Across Canada
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--rebrand-text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Star size={16} fill="#FFB100" color="#FFB100" /> Trusted by Sports Fans
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--rebrand-text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span style={{ fontSize: '1.1rem' }}>🍁</span> Proudly Canadian Owned
        </div>
      </div>

      {/* 2. SHOP BY SPORT - GRIDS ASSIMÉTRICOS (Mais amplo, vem primeiro) */}
      <section className="rebrand-section container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '4rem' }}>
        <div className="rebrand-section-header">
          <h2 className="rebrand-section-title">Shop By Sport</h2>
        </div>

        <div className="rebrand-sport-grid">
          {sportsCategories.map((sport) => (
            <div 
              key={sport.name} 
              className="rebrand-sport-card"
              onClick={() => navigate(`/rebrand/colecao/${sport.link}`)}
            >
              <div className="rebrand-sport-card-bg" style={{ backgroundImage: `url('${sport.img}')`, backgroundSize: sport.bgSize || 'cover', backgroundPosition: sport.bgPos || 'center top' }}></div>
              <div className="rebrand-sport-card-overlay"></div>
              <div className="rebrand-sport-card-info">
                <h3 className="rebrand-sport-name">{sport.name}</h3>
                <span className="rebrand-sport-btn">
                  Shop Now <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SHOP BY LEAGUE (MARCA REGISTRADA FANATICS - Refinamento, vem depois) */}
      <section style={{ borderBottom: '1px solid var(--rebrand-border)', padding: '4rem 2rem', background: '#F8F9FA' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '0.5rem' }}>
            Browse officially licensed gear
          </span>
          <h2 style={{ fontFamily: 'var(--rebrand-font-display)', fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: '0.9', margin: '0 0 3rem 0', color: 'var(--rebrand-text-main)', textTransform: 'uppercase' }}>
            SHOP BY LEAGUE
          </h2>

          <div className="rebrand-league-row" style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {leagueList.map((league) => (
              <div 
                key={league.name}
                onClick={() => navigate(`/rebrand/colecao/${league.link}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  width: '120px'
                }}
              >
                <div className="rebrand-league-circle">
                  {league.logo}
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--rebrand-text-main)', fontWeight: 700 }}>{league.name}</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--rebrand-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{league.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SEASON SPOTLIGHT (CMS DINÂMICO DE CAMPANHAS SAZONAIS) */}
      <section style={{ background: 'var(--rebrand-surface)', padding: '6rem 2rem', borderTop: '1px solid var(--rebrand-border)', borderBottom: '1px solid var(--rebrand-border)', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ position: 'relative', height: '480px' }}>
            {carouselSlides.map((slide, index) => (
              <div
                key={slide.sport}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: '4rem',
                  alignItems: 'center',
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  opacity: activeSlide === index ? 1 : 0,
                  transform: activeSlide === index ? 'translateX(0)' : 'translateX(30px)',
                  transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
                  pointerEvents: activeSlide === index ? 'auto' : 'none',
                  zIndex: activeSlide === index ? 2 : 1
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.4rem 1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#121416' }}>{slide.badge}</span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--rebrand-font-display)', fontSize: '5.5rem', fontWeight: 900, lineHeight: '0.85', letterSpacing: '-1px', margin: '0 0 1.5rem 0', color: '#121416', textTransform: 'uppercase' }}>
                    {slide.title}
                  </h2>
                  <div style={{ marginBottom: '2.5rem' }}>
                    <span style={{ fontSize: '1.1rem', color: 'var(--rebrand-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Starting at</span>
                    <span style={{ fontFamily: 'var(--rebrand-font-display)', fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1px', color: '#121416', display: 'block' }}>{slide.price}</span>
                  </div>
                  <Link to={slide.link} className="rebrand-btn rebrand-btn-primary" style={{ background: '#121416', color: '#fff', borderColor: '#121416', padding: '1rem 2.5rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {slide.btnText}
                  </Link>
                </div>

                <div style={{ position: 'relative', height: '480px', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--rebrand-shadow-lg)' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `url('${slide.img}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Dot Indicators */}
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '2.5rem' }}>
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                style={{
                  width: activeSlide === index ? '32px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: activeSlide === index ? 'var(--rebrand-text-main)' : 'rgba(0,0,0,0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Dinamic Featured Products in active Slide */}
          {activeSlideProducts.length > 0 && (
            <div style={{ marginTop: '4rem', borderTop: '1px dashed rgba(0,0,0,0.12)', paddingTop: '3rem', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#121416', fontWeight: 800, margin: 0 }}>
                  Featured in {activeSlideData.sport}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', fontWeight: 600 }}>Spotlight Collection</span>
              </div>
              
              <div className="rebrand-products-grid">
                {activeSlideProducts.map((product) => {
                  const hasColors = product.colors && product.colors.length > 0;
                  return (
                    <div key={product.id} className="rebrand-product-card">
                      <div className="rebrand-product-img-wrapper">
                        {product.badge && (
                          <span className={product.badge.toLowerCase().includes('almost') ? "rebrand-product-badge-red" : "rebrand-product-badge"}>
                            {product.badge}
                          </span>
                        )}
                        <img src={product.image} alt={product.name} className="rebrand-product-img" />
                        
                        <div className="rebrand-product-actions">
                          <button 
                            onClick={() => {
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image
                              }, 'M');
                            }} 
                            className="rebrand-product-btn-quick"
                          >
                            <ShoppingBag size={14} style={{ marginRight: '0.4rem' }} /> Add to Cart
                          </button>
                          <button 
                            onClick={() => navigate(`/rebrand/produto/${product.id}`)} 
                            className="rebrand-product-btn-view"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="rebrand-product-info">
                        {hasColors && (
                          <div className="rebrand-product-colors">
                            {product.colors.map((c, i) => (
                              <span key={i} className="rebrand-color-dot" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        )}
                        <h4 className="rebrand-product-title" onClick={() => navigate(`/rebrand/produto/${product.id}`)}>
                          {product.name}
                        </h4>
                        <div className="rebrand-product-rating">
                          <Star size={12} fill="currentColor" />
                          <span>{product.rating} ({product.reviews})</span>
                        </div>
                        <div className="rebrand-product-price-row">
                          <span className="rebrand-product-price">${product.price.toFixed(2)} CAD</span>
                          {product.oldPrice && (
                            <span className="rebrand-product-old-price">${product.oldPrice.toFixed(2)} CAD</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 5. FEATURED COLLECTIONS & PRODUCTS WITH PRICE DISCOUNTS */}
      <section className="rebrand-section container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="rebrand-section-header" style={{ marginBottom: '2.5rem' }}>
          <h2 className="rebrand-section-title">Trending Fan Gear</h2>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          {['all', 'Soccer', 'Basketball', 'Football', 'Baseball', 'Hockey'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.6rem 1.8rem',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: activeTab === tab ? '#121416' : 'transparent',
                color: activeTab === tab ? '#ffffff' : 'var(--rebrand-text-muted)',
                borderBottom: activeTab === tab ? 'none' : '2px solid transparent',
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
            >
              {tab === 'all' ? 'Show All' : tab}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="rebrand-products-grid">
          {filteredProducts.map((product) => {
            const hasColors = product.colors && product.colors.length > 0;
            return (
              <div key={product.id} className="rebrand-product-card">
                <div className="rebrand-product-img-wrapper">
                  {product.badge && (
                    <span className={product.badge.toLowerCase().includes('almost') ? "rebrand-product-badge-red" : "rebrand-product-badge"}>
                      {product.badge}
                    </span>
                  )}
                  <img src={product.image} alt={product.name} className="rebrand-product-img" />
                  
                  {/* Hover Actions */}
                  <div className="rebrand-product-actions">
                    <button 
                      onClick={() => {
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image
                        }, 'M');
                      }} 
                      className="rebrand-product-btn-quick"
                    >
                      <ShoppingBag size={14} style={{ marginRight: '0.4rem' }} /> Add to Cart
                    </button>
                    <button 
                      onClick={() => navigate(`/rebrand/produto/${product.id}`)}
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
                  
                  {/* Colors Bullets */}
                  {hasColors && (
                    <div className="rebrand-color-bullets">
                      {product.colors.map(col => (
                        <span key={col} className="rebrand-color-bullet" style={{ backgroundColor: col }} title={col} />
                      ))}
                    </div>
                  )}

                  <Link to={`/rebrand/produto/${product.id}`} style={{ textDecoration: 'none' }}>
                    <h4 className="rebrand-product-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.4rem 0' }}>{product.name}</h4>
                  </Link>

                  <div className="rebrand-product-price-row">
                    <div className="rebrand-price-container">
                      <span className="rebrand-product-price ${product.oldPrice ? 'rebrand-price-sale' : ''}">
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
          })}
        </div>
      </section>

      {/* 6. TRENDING TEAMS CAROUSEL */}
      <section style={{ borderTop: '1px solid var(--rebrand-border)', borderBottom: '1px solid var(--rebrand-border)', padding: '4rem 0', background: 'var(--rebrand-surface)' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '2.5rem', color: 'var(--rebrand-text-main)', fontFamily: 'var(--rebrand-font-display)' }}>
            TRENDING TEAMS IN CANADA
          </h3>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {trendingTeams.map((team, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/busca?q=${encodeURIComponent(team.name)}`)}
                style={{ 
                  background: '#ffffff', 
                  padding: '1rem 2rem', 
                  borderRadius: '6px', 
                  border: '1px solid var(--rebrand-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  transition: 'all 0.2s'
                }}
                className="interactive-card"
              >
                <span style={{ fontSize: '1.2rem' }}>{team.logo}</span>
                <div style={{ textAlign: 'left' }}>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--rebrand-text-main)' }}>{team.name}</h5>
                  <span style={{ fontSize: '0.7rem', color: 'var(--rebrand-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{team.league}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
