import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { ArrowRight, Star, ShoppingBag, Eye, ShieldCheck, Truck, RefreshCw, BadgeAlert, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatProductName } from '../utils/format';

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

const TESTIMONIAL_TRANSLATIONS = {
  'd6223893-7227-40c3-947d-11f96921ae06': 'Wonderful service, friendliness, perfect support, and most importantly: the quality jersey, gorgeous, in perfect condition! More than satisfied! Thank you so much!!',
  '4cd53ea6-8c6c-4ccb-926a-47f0f965365f': 'I bought the Brazil national team 2026 fan jersey! Great quality and wonderful delivery service and support!  ',
  '8621ceeb-e57c-4623-923b-9ca53c2e09d9': '10/10 service and support! Had issues with Canada Post but iFooty was always helping out',
  'c42b0670-7ddc-4f1b-aa16-5f1f566ccfdf': 'Excellent service, help with choosing size, fast replies, and follow-up from beginning to end. The jersey is beautiful! I chose the blue Brazil team one size L, I am 1.70m and 70kg. If you prefer it slightly looser, choose one size up from what you normally wear for this model. The fit is great and the quality is very good! Recommended and would buy again! :)',
  '1d9377f8-c8d4-483f-ad3d-03fd509f21bc': 'Impeccable service, product of the highest quality, congratulations on the professionalism, highly recommend.',
  '8af20883-0fda-4ab4-bbf9-0728df655c82': 'Great service, arrived super fast, and the jerseys are of excellent quality. I will definitely order more times and have already recommended it to several friends.',
  'afddf8e2-cba3-4ab9-95de-d9cc4f8bc7ad': 'I bought the Flamengo one and was impressed with the quality! Andre always replies quickly. I already ordered two more since then. Truly personalized service!',
  '3cd2b279-a8d1-4d99-b4de-64e214ecc314': 'Excellent service, the jersey arrived on time, good material, highly recommended!!',
  '4466d176-24fa-4b6e-beb5-20b7de3d9832': 'I ordered the Brazil jersey on Monday and André delivered it to me the same day. Beautiful yellow jersey, excellent material.',
  'bc3752ac-06c3-4985-afbc-00e236468124': 'I bought the yellow national team jersey for my husband for his birthday. The jersey was very well packaged, authentic feeling, and arrived right on time. He loved the gift and already wore it to watch the friendlies.',
  '61523a73-de03-4b2c-9145-1e32944bd4ae': 'I am from FlaVancouver! I ordered the home and a retro one. What beautiful jerseys, man! Premium quality indeed, fast delivery.',
  'af06103b-7539-4065-b263-562c56bce71d': 'The national team blue away jersey looks beautiful! Top-quality material, perfect stitching. They helped me choose the size and nailed it. 10/10!',
  'c27f242e-dad0-477a-b9cc-23fbc100eafa': 'I have already bought about 5 Palmeiras jerseys here - home, away, retro... All impeccable! Best jersey store in Canada without a doubt. Always fast delivery!',
  'bcd87307-07e4-491a-bcdd-73fbd2977793': 'The Real Madrid jersey for my brother turned out so beautiful! Payment by E-Transfer is super convenient. Already looking at what my next one will be, haha',
  '39605814-2aac-44e6-8a4e-ec913f8251f7': 'I bought the Palmeiras one (my favorite team) and the quality really surprised me! Top-notch material, impeccable stitching. After that, I have already placed 3 more orders. Extremely trustworthy!',
  '4a2931bc-fe9f-42bd-bf89-0cf42dbab9ba': 'I received my order 😍 great quality, highly recommend!',
  'ebf63b5a-2098-4cef-9f21-a5c33d014129': 'Ordered Brazil jerseys for the whole family to watch the Copa America games. André replied super fast; one size came wrong but he quickly exchanged it. Thanks.',
  'f9a99182-37bc-4ec2-a9ed-86913fdc6ff4': 'Excellent customer service, they were super helpful! The jerseys are great and of high quality, we will definitely buy more!'
};

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [dbProducts, setDbProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [showEnglish, setShowEnglish] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselSlides, setCarouselSlides] = useState(CAROUSEL_SLIDES);
  const [heroImage, setHeroImage] = useState('/assets/rebrand/locker_room_hero.jpg');
  const [heroTitle, setHeroTitle] = useState('WEAR YOUR TEAM.');
  const [heroSubtitle, setHeroSubtitle] = useState('THE HOME OF SPORTS JERSEYS.');

  const toggleTranslation = (id) => {
    setShowEnglish(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestimonialNext = () => {
    const el = document.getElementById('testimonials-scroll');
    if (!el) return;
    const card = el.children[0];
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width + 32; // card width + gap (2rem = 32px)
    
    // Check if we are at the end of the scroll (with a 15px threshold to account for rounding)
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 15;
    if (isAtEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  const handleTestimonialPrev = () => {
    const el = document.getElementById('testimonials-scroll');
    if (!el) return;
    const card = el.children[0];
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width + 32;
    
    const isAtStart = el.scrollLeft <= 15;
    if (isAtStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const handleApplyPromo = () => {
    const el = document.getElementById('trending-fan-gear');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const { data } = await supabase
          .from('testimonials')
          .select('*')
          .eq('status', 'approved')
          .order('id', { ascending: false });
        if (data) {
          setTestimonials(data);
        }
      } catch (err) {
        console.error("Error loading testimonials:", err);
      }
    }
    loadTestimonials();
  }, []);

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
    async function loadHeroSettings() {
      try {
        const { data: imgData } = await supabase.from('store_settings').select('value').eq('key', 'rebrand_hero_image').single();
        if (imgData?.value) setHeroImage(imgData.value);

        const { data: titleData } = await supabase.from('store_settings').select('value').eq('key', 'rebrand_hero_title').single();
        if (titleData?.value) setHeroTitle(titleData.value);

        const { data: subData } = await supabase.from('store_settings').select('value').eq('key', 'rebrand_hero_subtitle').single();
        if (subData?.value) setHeroSubtitle(subData.value);
      } catch (err) {
        console.warn("Could not load hero settings:", err);
      }
    }
    loadSpotlight();
    loadHeroSettings();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        let salesRanking = {};
        try {
          const { data: settingsData } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', 'product_sales_ranking')
            .single();
          if (settingsData && settingsData.value) {
            salesRanking = typeof settingsData.value === 'string' 
              ? JSON.parse(settingsData.value) 
              : settingsData.value;
          }
        } catch (e) {
          console.error("Failed to load sales ranking settings:", e);
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (data) {
          const formatted = data.map((p, idx) => {
            const salesCount = salesRanking[p.id] || 0;
            const isBestseller = p.is_bestseller || salesCount > 0;
            const isBasketball = p.category === 'NBA' || p.category === 'Basketball';
            const isFootball = p.category === 'NFL' || p.category === 'Football';
            const isBaseball = p.category === 'MLB' || p.category === 'Baseball';
            const isHockey = p.category === 'NHL' || p.category === 'Hockey';
            
            let displayCategory = 'Soccer';
            if (isBasketball) displayCategory = 'Basketball';
            else if (isFootball) displayCategory = 'Football';
            else if (isBaseball) displayCategory = 'Baseball';
            else if (isHockey) displayCategory = 'Hockey';

            return {
              id: p.id,
              name: p.name,
              price: p.price || 89.90,
              oldPrice: p.is_sale ? (p.price || 89.90) + 30.00 : null,
              category: displayCategory,
              dbCategory: p.category,
              image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
              rating: p.rating || 4.8,
              reviews: p.reviews_count || 32,
              colors: ['#000000', '#ffffff', '#e31837'],
              badge: isBestseller ? 'Best Seller' : (p.is_sale ? 'Sale' : (p.is_new ? 'New Arrival' : '')),
              salesCount: salesCount,
              is_bestseller: isBestseller,
              is_trending: p.is_trending || false
            };
          });
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

  const getTrendingProducts = () => {
    if (activeTab === 'all') {
      return dbProducts.filter(p => p.is_trending).slice(0, 6);
    }
    return dbProducts
      .filter(p => p.is_trending && p.category.toLowerCase() === activeTab.toLowerCase())
      .slice(0, 6);
  };

  const filteredProducts = getTrendingProducts();

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
        <div className="rebrand-hero-bg" style={{ backgroundImage: `url(${heroImage})` }}></div>
        <div className="rebrand-hero-overlay"></div>

        <div className="rebrand-hero-content">
          <div className="rebrand-hero-top-group">
            <h1 className="rebrand-hero-title">
              {heroTitle.includes('TEAM.') ? (
                <>
                  {heroTitle.replace('TEAM.', '')}<span>TEAM.</span>
                </>
              ) : (
                heroTitle
              )}
            </h1>
            <p className="rebrand-hero-subline">
              {heroSubtitle}
            </p>
          </div>

          <div className="rebrand-hero-bottom-group">
            <div className="rebrand-hero-buttons">
              <button onClick={() => navigate('/rebrand/colecao/soccer')} className="rebrand-btn rebrand-btn-primary" style={{ background: 'var(--rebrand-volt)', color: '#000', borderColor: 'var(--rebrand-volt)' }}>
                SHOP JERSEYS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA DE DIFERENCIAIS / TRUST ELEMENT (Otimizado abaixo do Hero) */}
      <div className="rebrand-trustbar">
        <div className="rebrand-trustbar-item">
          <Check size={16} color="#2b8a3e" style={{ strokeWidth: 3 }} /> Premium Stitched Jerseys
        </div>
        <div className="rebrand-trustbar-item">
          <Truck size={18} color="#2b8a3e" /> Fast Shipping Across Canada
        </div>
        <div className="rebrand-trustbar-item">
          <Star size={16} fill="#FFB100" color="#FFB100" /> Trusted by Sports Fans
        </div>
        <div className="rebrand-trustbar-item">
          <span style={{ fontSize: '1.1rem' }}>🍁</span> Proudly Canadian Owned
        </div>
      </div>

      {/* 2. SHOP BY SPORT - GRIDS ASSIMÉTRICOS (Mais amplo, vem primeiro) */}
      <section className="rebrand-section container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '4rem' }}>
        <div className="rebrand-section-header">
          <h2 className="rebrand-section-title">Shop by Sport</h2>
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
          <h2 className="rebrand-section-title" style={{ margin: '0 0 3rem 0' }}>
            Shop by League
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
      <section className="rebrand-spotlight-section">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div className="rebrand-spotlight-carousel-wrapper">
            {carouselSlides.map((slide, index) => (
              <div
                key={slide.sport}
                className={`rebrand-spotlight-slide ${activeSlide === index ? 'active' : ''}`}
              >
                <div className="rebrand-spotlight-info">
                  <div className="rebrand-spotlight-badge-container">
                    <span className="rebrand-spotlight-badge">{slide.badge}</span>
                  </div>
                  <h2 className="rebrand-spotlight-title">
                    {slide.title}
                  </h2>
                  <div className="rebrand-spotlight-price-container">
                    <span className="rebrand-spotlight-price-label">Starting at</span>
                    <span className="rebrand-spotlight-price">{slide.price}</span>
                  </div>
                  <div className="rebrand-spotlight-btn-container">
                    <Link to={slide.link} className="rebrand-btn rebrand-btn-primary spotlight-btn">
                      {slide.btnText}
                    </Link>
                  </div>
                </div>

                <div className="rebrand-spotlight-image-container">
                  <div 
                    className="rebrand-spotlight-image"
                    style={{ backgroundImage: `url('${slide.img}')` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Dot Indicators */}
          <div className="rebrand-spotlight-dots">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`rebrand-spotlight-dot ${activeSlide === index ? 'active' : ''}`}
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
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="rebrand-product-img" 
                          onClick={() => navigate(`/rebrand/produto/${product.id}`)}
                          style={{ cursor: 'pointer' }}
                        />
                        
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
                        <h4 className="rebrand-product-title" onClick={() => navigate(`/rebrand/produto/${product.id}`)}>
                          {formatProductName(product.name)}
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

      {/* Special Offer (Combos) Section - Clean & Minimal Integration */}
      <section className="rebrand-section container" style={{ maxWidth: '1400px', margin: '3rem auto 1.5rem auto', padding: '0 1.5rem' }}>
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid var(--rebrand-border)', 
          borderRadius: '8px', 
          padding: '2.5rem 1.5rem', 
          textAlign: 'center' 
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            color: 'var(--rebrand-text-main)', 
            fontWeight: 800, 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}>
            ⚡ Special Bundle Deals
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', maxWidth: '800px', margin: '0 auto' }}>
            {/* Combo 2 Jerseys */}
            <div style={{ 
              flex: 1, 
              minWidth: '260px', 
              background: '#fdfdfd', 
              border: '1px solid var(--rebrand-border)', 
              borderRadius: '6px', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rebrand-text-main)', margin: '0 0 0.5rem 0' }}>Buy 2 Jerseys</h3>
                <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '0.8rem', margin: '0 0 1.25rem 0' }}>
                  Get them for only <strong>$91.97 CAD</strong> (Save $3.83)
                </p>
              </div>

              <button 
                onClick={handleApplyPromo}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '4px',
                  background: '#121416',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                className="interactive-card"
              >
                Select Jerseys
              </button>
            </div>

            {/* Combo 3 Jerseys */}
            <div style={{ 
              flex: 1, 
              minWidth: '260px', 
              background: '#fdfdfd', 
              border: '1px solid var(--rebrand-border)', 
              borderRadius: '6px', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-0.6rem',
                right: '1rem',
                background: 'var(--rebrand-volt)',
                color: '#000000',
                padding: '0.15rem 0.5rem',
                borderRadius: '3px',
                fontSize: '0.6rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Best Deal
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rebrand-text-main)', margin: '0 0 0.5rem 0' }}>Buy 3 Jerseys</h3>
                <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '0.8rem', margin: '0 0 1.25rem 0' }}>
                  Get them for only <strong>$133.64 CAD</strong> (Save $10.06)
                </p>
              </div>

              <button 
                onClick={handleApplyPromo}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '4px',
                  background: '#121416',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                className="interactive-card"
              >
                Select Jerseys
              </button>
            </div>
          </div>

          <span style={{ display: 'block', marginTop: '1.25rem', color: 'var(--rebrand-text-muted)', fontSize: '0.7rem' }}>
            * Discounts are calculated and applied automatically at checkout
          </span>
        </div>
      </section>

      {/* 5. FEATURED COLLECTIONS & PRODUCTS WITH PRICE DISCOUNTS */}
      <section id="trending-fan-gear" className="rebrand-section container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="rebrand-section-header" style={{ marginBottom: '2.5rem' }}>
          <h2 className="rebrand-section-title">Trending Fan Gear</h2>
        </div>

        {/* Tab Filters */}
        <div className="rebrand-filter-tabs">
          {['all', 'Soccer', 'Basketball', 'Football', 'Baseball', 'Hockey'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rebrand-filter-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'all' ? 'Show All' : tab}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '1px dashed var(--rebrand-border)', borderRadius: '10px', color: 'var(--rebrand-text-muted)' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No products marked as trending yet.</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Configure trending products in the admin panel to show them here.</p>
          </div>
        ) : (
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
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="rebrand-product-img" 
                      onClick={() => navigate(`/rebrand/produto/${product.id}`)}
                      style={{ cursor: 'pointer' }}
                    />
                    
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
                    
                    <Link to={`/rebrand/produto/${product.id}`} style={{ textDecoration: 'none' }}>
                      <h4 className="rebrand-product-title">{formatProductName(product.name)}</h4>
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
        )}
      </section>

      {/* 6. TRENDING TEAMS CAROUSEL */}
      <section className="rebrand-teams-section">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <h3 className="rebrand-teams-title">
            TRENDING TEAMS IN CANADA
          </h3>
          <div className="rebrand-teams-grid">
            {trendingTeams.map((team, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/busca?q=${encodeURIComponent(team.name)}`)}
                className="rebrand-team-card interactive-card"
              >
                <span style={{ fontSize: '1.2rem' }}>{team.logo}</span>
                <div style={{ textAlign: 'left' }}>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--rebrand-text-main)', lineHeight: '1.2' }}>{team.name}</h5>
                  <span style={{ fontSize: '0.7rem', color: 'var(--rebrand-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{team.league}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CLIENT TESTIMONIALS (SOCIAL PROOF) */}
      {testimonials.length > 0 && (
        <section className="rebrand-section container" style={{ maxWidth: '1400px', margin: '4rem auto 2rem auto', padding: '0 1.5rem' }}>
          <style>{`
            .testimonials-card-responsive {
              flex: 0 0 100% !important;
            }
            @media (min-width: 768px) {
              .testimonials-card-responsive {
                flex: 0 0 calc(50% - 1rem) !important;
              }
            }
            @media (min-width: 1024px) {
              .testimonials-card-responsive {
                flex: 0 0 calc(33.333% - 1.333rem) !important;
              }
            }
          `}</style>
          
          <div className="rebrand-section-header" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h2 className="rebrand-section-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>What Our Customers Say</h2>
            <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Real feedback from sports fans across Canada</p>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={handleTestimonialPrev}
              style={{
                position: 'absolute',
                left: '-1.2rem',
                zIndex: 10,
                background: '#ffffff',
                border: '1px solid var(--rebrand-border)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={20} />
            </button>

            <div 
              id="testimonials-scroll"
              style={{ 
                display: 'flex', 
                gap: '2rem', 
                overflowX: 'auto', 
                scrollSnapType: 'x mandatory', 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                padding: '0.5rem 0.2rem',
                width: '100%'
              }}
            >
              {testimonials.map((t) => (
                <div 
                  key={t.id} 
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid var(--rebrand-border)', 
                    borderRadius: '10px', 
                    padding: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    minHeight: '220px', 
                    transition: 'box-shadow .2s',
                    boxSizing: 'border-box',
                    scrollSnapAlign: 'start'
                  }} 
                  className="interactive-card testimonials-card-responsive"
                >
                  <div>
                    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1rem', color: '#FFB100' }}>
                      {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                        <Star key={idx} size={15} fill="currentColor" color="currentColor" />
                      ))}
                    </div>
                    <p style={{ fontStyle: 'italic', color: 'var(--rebrand-text-main)', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
                      "{showEnglish[t.id] ? TESTIMONIAL_TRANSLATIONS[t.id] : t.content}"
                    </p>
                    {TESTIMONIAL_TRANSLATIONS[t.id] && (
                      <button 
                        onClick={() => toggleTranslation(t.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--rebrand-text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          marginTop: '0.5rem',
                          textDecoration: 'underline',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        {showEnglish[t.id] ? 'Show Original' : 'Translate to English'}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#121416' }}>
                        {t.name ? t.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#121416' }}>{t.name}</h5>
                      <span style={{ fontSize: '0.7rem', color: 'var(--rebrand-text-muted)', fontWeight: 600 }}>{t.location || 'Verified Buyer'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleTestimonialNext}
              style={{
                position: 'absolute',
                right: '-1.2rem',
                zIndex: 10,
                background: '#ffffff',
                border: '1px solid var(--rebrand-border)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
              aria-label="Next testimonials"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;
