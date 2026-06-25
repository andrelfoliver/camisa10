import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { trackEvent } from '../services/analytics';

import { brasil2025Products } from '../data/brasil2025';
import {
  ShieldCheck, Truck, Star, CheckCircle2, ChevronDown, ChevronUp, Quote, Play
} from 'lucide-react';
import SizeGuideModal from '../components/SizeGuideModal';
import ProductMedia from '../components/ProductMedia';
import SEO from '../components/SEO';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        {question}
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <p style={{ marginTop: '1rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{answer}</p>}
    </div>
  );
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, pricingConfig } = useCart();
  const { t, language, translateProductDisplay, formatPrice } = useLanguage();
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);


  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  // Gallery Logic
  const [activeImage, setActiveImage] = useState('');

  // Form Customization Options
  const [selectedSize, setSelectedSize] = useState('M');

  // Lógica dinâmica para definir quais tamanhos exibir
  const isShoes = product?.category?.toLowerCase().includes('tênis') ||
    product?.category?.toLowerCase().includes('tenis') ||
    product?.category?.toLowerCase().includes('shoes') ||
    product?.name?.toLowerCase().includes('tênis') ||
    product?.name?.toLowerCase().includes('tenis') ||
    product?.name?.toLowerCase().includes('sapato') ||
    product?.name?.toLowerCase().includes('shoe') ||
    product?.name?.toLowerCase().includes('sneaker');

  const isNba = product?.category?.toLowerCase() === 'nba' ||
    product?.category?.toLowerCase() === 'basquete' ||
    product?.league?.toLowerCase() === 'nba' ||
    product?.name?.toLowerCase().includes('nba') ||
    product?.name?.toLowerCase().includes('basquete') ||
    product?.name?.toLowerCase().includes('basketball') ||
    product?.name?.toLowerCase().includes('jersey nba');

  const isStreetwear = product?.category?.toLowerCase() === 'streetwear' ||
    product?.category?.toLowerCase() === 'camisetas' ||
    product?.name?.toLowerCase().includes('streetwear') ||
    product?.name?.toLowerCase().includes('camiseta');

  const isKids = !isShoes && !isNba && !isStreetwear && (product?.category?.toLowerCase().includes('infantil') ||
    product?.name?.toLowerCase().includes('infantil') ||
    product?.name?.toLowerCase().includes('kids'));
  
  const isBaby = !isShoes && !isNba && !isStreetwear && (product?.version === 'Baby body' ||
    product?.version === 'Baby Body' ||
    product?.name?.toLowerCase().includes('baby body') ||
    product?.name?.toLowerCase().includes('body de bebê') ||
    product?.name?.toLowerCase().includes('body bebê'));

  const isFemale = !isShoes && !isNba && !isStreetwear && (product?.category?.toLowerCase().includes('feminina') ||
    product?.category?.toLowerCase().includes('womens') ||
    product?.name?.toLowerCase().includes('feminina') ||
    product?.name?.toLowerCase().includes('womens') ||
    product?.version?.toLowerCase().includes('feminina') ||
    product?.version?.toLowerCase().includes('womens') ||
    product?.version?.toLowerCase().includes('women'));

  const isPlayer = !isShoes && !isNba && !isStreetwear && (
    product?.version?.toLowerCase().includes('jogador') ||
    product?.version?.toLowerCase().includes('player') ||
    product?.name?.toLowerCase().includes('jogador') ||
    product?.name?.toLowerCase().includes('player')
  );

  const SHOE_SIZES = ['US 6.5 (BR 37)', 'US 7 (BR 38)', 'US 8 (BR 39)', 'US 8.5 (BR 40)', 'US 9.5 (BR 41)', 'US 10 (BR 42)', 'US 11 (BR 43)', 'US 12 (BR 44)'];

  const sizes = isShoes
    ? SHOE_SIZES
    : isBaby
      ? ['3M', '6M', '9M', '12M']
      : isKids
        ? ['16', '18', '20', '22', '24', '26', '28']
        : isFemale
          ? ['S', 'M', 'L', 'XL', '2XL']
          : isPlayer
            ? ['S', 'M', 'L', 'XL', '2XL']
            : isStreetwear
              ? ['S', 'M', 'L', 'XL', '2XL', '3XL']
              : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  const availableSizes = sizes.filter(s => !product?.unavailable_sizes?.includes(s));

  // Ajusta o tamanho selecionado inicial se for infantil, bebê ou se o padrão estiver bloqueado
  useEffect(() => {
    if (isShoes && !SHOE_SIZES.includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || 'US 8.5 (BR 40)';
      setSelectedSize(firstAvailable);
    } else if (isBaby && !['3M', '6M', '9M', '12M'].includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || '6M';
      setSelectedSize(firstAvailable);
    } else if (isKids && !['16', '18', '20', '22', '24', '26', '28'].includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || '20';
      setSelectedSize(firstAvailable);
    } else if (isFemale && !['S', 'M', 'L', 'XL', '2XL'].includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || 'M';
      setSelectedSize(firstAvailable);
    } else if (isPlayer && !['S', 'M', 'L', 'XL', '2XL'].includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || 'M';
      setSelectedSize(firstAvailable);
    } else if (isStreetwear && !['S', 'M', 'L', 'XL', '2XL', '3XL'].includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || 'M';
      setSelectedSize(firstAvailable);
    } else if (product?.unavailable_sizes?.includes(selectedSize)) {
      // Se o tamanho padrão estiver bloqueado, pega o primeiro disponível
      const firstAvailable = availableSizes[0] || (isShoes ? 'US 8.5 (BR 40)' : isBaby ? '6M' : isKids ? '20' : 'M');
      setSelectedSize(firstAvailable);
    }
  }, [isBaby, isKids, isFemale, isPlayer, isShoes, isStreetwear, product, availableSizes, selectedSize, SHOE_SIZES]);

  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [isExtraCustomized, setIsExtraCustomized] = useState(false);
  const [customExtraName, setCustomExtraName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [onlyShirt, setOnlyShirt] = useState(false);

  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [interestName, setInterestName] = useState('');
  const [interestWhatsapp, setInterestWhatsapp] = useState('');
  const [interestSuccess, setInterestSuccess] = useState(false);
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);

  useEffect(() => {
    setOnlyShirt(false);
    async function loadData() {
      // Se for um id do mock (ex: 'q1', '1', etc.)
      const isMockId = id.startsWith('q') || id.startsWith('geral_');
      if (isMockId) {
        let p;
        if (id.startsWith('q')) {
          p = {
            q1: { id: 'q1', name: 'Brasil Titular 25/26 (Torcedor)', category: 'Seleção Brasileira', price: 44.90, image: '/catalog/shirt_188.jpg', gallery: ['/catalog/shirt_188.jpg'] },
            q2: { id: 'q2', name: 'Brasil Titular 25/26 (Jogador)', category: 'Seleção Brasileira', price: 69.90, image: '/catalog/shirt_183.jpg', gallery: ['/catalog/shirt_183.jpg'] },
            q3: { id: 'q3', name: 'Brasil Reserva 25/26', category: 'Seleção Brasileira', price: 44.90, image: '/catalog/shirt_165.jpg', gallery: ['/catalog/shirt_165.jpg'] },
            q4: { id: 'q4', name: 'Brasil Feminina Titular/Reserva', category: 'Feminina', price: 44.90, image: '/catalog/shirt_344.jpg', gallery: ['/catalog/shirt_344.jpg'] }
          }[id];
        } else if (id.startsWith('geral_')) {
          const idx = parseInt(id.replace('geral_', ''));
          p = {
            id: `geral_${idx}`,
            name: `Camisa Torcedor/Geral #${idx}`,
            image: `/camisas/@carinhacriativo (${idx}).png`,
            gallery: [`/camisas/@carinhacriativo (${idx}).png`],
            price: 69.90
          };
        }
        
        if (p) {
          const galleryWithMain = [
            p.image,
            ...(p.gallery || [])
          ].filter((val, idx, self) => val && self.indexOf(val) === idx);
          setProduct({ ...p, gallery: galleryWithMain });
          setActiveImage(p.image);
          trackEvent('ViewContent', {
            content_name: p.name,
            content_category: p.category,
            content_ids: [p.id],
            content_type: 'product',
            value: p.price || 109.99,
            currency: 'CAD'
          });
        }
        setLoading(false);
        return;
      }

      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        const galleryWithMain = [
          data.image,
          ...(data.gallery || [])
        ].filter((val, idx, self) => val && self.indexOf(val) === idx);
        setProduct({ ...data, gallery: galleryWithMain });
        setActiveImage(data.image);
        trackEvent('ViewContent', {
          content_name: data.name,
          content_category: data.category,
          content_ids: [data.id],
          content_type: 'product',
          value: data.price || 109.99,
          currency: 'CAD'
        });
      }
      setLoading(false);
    }
    loadData();

    async function loadTestimonials() {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('date', { ascending: false })
        .limit(6);
      if (data && data.length > 0) setTestimonials(data);
    }
    loadTestimonials();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.5rem', color: 'var(--text-muted)' }}>{t('product_loading')}</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: '5rem' }}>{t('product_not_found')}</div>;


  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    if (!interestName || !interestWhatsapp) return;

    setIsSubmittingInterest(true);
    try {
      const { error } = await supabase.from('product_interests').insert({
        product_id: product.id,
        name: interestName,
        whatsapp: interestWhatsapp,
        size: selectedSize
      });

      if (error) {
        console.error("Error saving pre-order interest:", error);
      }
      
      setInterestSuccess(true);
    } catch (err) {
      console.error("Unexpected error saving pre-order interest:", err);
      setInterestSuccess(true);
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleInterestWhatsAppClick = () => {
    const waNumber = pricingConfig?.whatsAppNumber || '17788061419';
    const text = language === 'pt'
      ? `Olá! Tenho interesse no lançamento da camisa ${product.name} no tamanho ${selectedSize} na pré-venda. Meu nome é ${interestName}.`
      : `Hello! I'm interested in the pre-order of the jersey ${product.name} in size ${selectedSize}. My name is ${interestName}.`;
    
    window.open(`https://wa.me/${String(waNumber).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAdd = (buyNow = false) => {
    // Busca a primeira imagem que NÃO seja vídeo para usar como thumbnail na sacola
    const isVideo = (url) => url?.toLowerCase().endsWith('.mp4');
    let displayImage = product.image;

    if (isVideo(displayImage)) {
      displayImage = product.gallery?.find(img => !isVideo(img)) || '/placeholder.jpg';
    }

    const productWithFix = { ...product, image: displayImage };

    for (let i = 0; i < quantity; i++) {
      addToCart(productWithFix, selectedSize, {
        nameNumber: isCustomized,
        customName,
        customNumber,
        extraCustomization: isExtraCustomized,
        customExtraName,
        onlyShirt: isKids ? onlyShirt : false
      });
    }
    if (buyNow) navigate('/checkout');
  };

  let basePrice = Number(product.price) || 47.90;
  if (isKids) {
    if (onlyShirt) {
      if (['16', '18', '20', '22'].includes(selectedSize)) {
        basePrice = 37.90;
      } else if (['24', '26', '28'].includes(selectedSize)) {
        basePrice = 42.90;
      }
    } else {
      if (['16', '18', '20', '22'].includes(selectedSize)) {
        basePrice = 49.90;
      } else if (['24', '26', '28'].includes(selectedSize)) {
        basePrice = 54.90;
      }
    }
  }
  let currentTotal = basePrice;
  if (['2XL', '3XL'].includes(selectedSize)) currentTotal += Number(pricingConfig?.size2XL3XL || 7.00);
  if (selectedSize === '4XL') currentTotal += Number(pricingConfig?.size4XL || 10.00);
  if (isCustomized) currentTotal += Number(pricingConfig?.nameNumber || 12.00);
  if (isExtraCustomized) currentTotal += 6.90;

  // Encontra a primeira imagem estática (não .mp4) para usar de miniatura no SEO/og:image do WhatsApp/redes sociais
  const seoImage = [product.image, ...(product.gallery || [])]
    .filter(img => img && !img.toLowerCase().endsWith('.mp4'))[0] || product.image;

  const schemaOrgJSONLD = {
    "@context": "http://schema.org",
    "@type": "Product",
    "name": translateProductDisplay(product.name),
    "image": seoImage,
    "description": product.description || `Adquira a ${translateProductDisplay(product.name)} na iFooty. Qualidade premium, pronta entrega no Canadá.`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "CAD",
      "price": basePrice,
      "availability": "http://schema.org/InStock",
      "url": `https://ifooty.ca/produto/${product.id}`
    }
  };

  return (
    <div style={{ paddingBottom: '5rem', minHeight: '100vh' }}>
      <SEO
        title={`${translateProductDisplay(product.name)} | Camisas de Futebol no Canadá`}
        description={product.description || `Compre a ${translateProductDisplay(product.name)} versão ${product.version || 'Torcedor/Jogador'} na iFooty. Camisa de futebol premium em tecido dry-fit. Pronta entrega com envio rápido para brasileiros no Canadá!`}
        image={seoImage}
        url={`https://ifooty.ca/produto/${product.id}`}
        type="product"
      />
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>

      <section className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="checkout-grid">

          {/* Lado Esquerdo - Galeria */}
          <div className="gallery-layout" style={{ position: 'relative' }}>
            <div className="gallery-thumbs desktop-only">
              {product.gallery?.map((img, i) => {
                const isVid = img?.toLowerCase().endsWith('.mp4');
                return (
                  <div 
                    key={i} 
                    style={{ position: 'relative', width: '80px', height: '80px', cursor: 'pointer' }}
                    onClick={() => setActiveImage(img)}
                  >
                    <ProductMedia
                      src={img}
                      alt={`Gallery ${i}`}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        border: activeImage === img ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                        borderRadius: '8px', background: 'var(--surface-color)'
                      }}
                    />
                    {isVid && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        pointerEvents: 'none'
                      }}>
                        <div style={{
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          padding: '0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Play size={16} fill="#fff" color="#fff" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="mobile-product-carousel"
                onScroll={(e) => {
                  const scrollLeft = e.target.scrollLeft;
                  const width = e.target.offsetWidth;
                  const index = Math.round(scrollLeft / width);
                  if (index !== product.gallery?.indexOf(activeImage)) {
                    setActiveImage(product.gallery[index]);
                  }
                }}
              >
                {product.gallery?.map((img, i) => (
                  <ProductMedia key={i} src={img} alt="" controls={img?.toLowerCase().endsWith('.mp4')} />
                ))}
              </div>

              <div className="carousel-dots">
                {product.gallery?.map((_, i) => (
                  <div key={i} className={`dot ${product.gallery[i] === activeImage ? 'active' : ''}`} />
                ))}
              </div>

              <div className="desktop-only" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '1rem' }}>
                <ProductMedia
                  src={activeImage}
                  alt={product.name}
                  controls={activeImage?.toLowerCase().endsWith('.mp4')}
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>

          {/* Lado Direito - Form de Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0', minWidth: 0 }}>

            <div className="mobile-only">
              <div className="mobile-breadcrumbs">{t('category_home')} &gt; {product.category || t('footer_catalog')} &gt; {translateProductDisplay(product.name)}</div>
              {product.coming_soon && (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  background: 'rgba(0, 216, 246, 0.1)', 
                  border: '1px solid rgba(0, 216, 246, 0.3)', 
                  padding: '0.3rem 0.6rem', 
                  borderRadius: '4px', 
                  color: '#00d8f6', 
                  fontWeight: 800, 
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                  boxShadow: '0 0 10px rgba(0, 216, 246, 0.1)',
                  alignSelf: 'flex-start'
                }}>
                  <span>🚀</span> {language === 'pt' ? 'Lançamento / Pré-Venda' : 'New Release / Pre-Order'}
                </div>
              )}
              <h1 className="mobile-product-title">{translateProductDisplay(product.name)}</h1>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SKU: {product.id}</div>

              {(() => {
                const numId = String(product.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const reviewsCount = (numId % 18) + 7;
                const rating = (4.8 + (numId % 3) / 10).toFixed(1);

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCD34D', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {rating} | {reviewsCount} {t('product_reviews_count')} |
                      <a
                        href={`https://wa.me/${pricingConfig?.whatsAppNumber || '17788061419'}?text=Olá! Tenho uma dúvida sobre o produto: ${product.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-color)', marginLeft: '0.3rem', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {t('product_ask_question')}
                      </a>
                    </span>
                  </div>
                );
              })()}

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{formatPrice(currentTotal)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>{t('product_free_shipping')}</div>
              </div>
            </div>

            <div className="desktop-only" style={{ flexDirection: 'column' }}>
              <div style={{ background: '#1f2937', color: '#fff', padding: '0.8rem 1rem', borderRadius: '4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', width: '100%', lineHeight: 1.4 }}>
                {t('product_volume_promo')}
              </div>
              {product.coming_soon && (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: 'rgba(0, 216, 246, 0.1)', 
                  border: '1px solid rgba(0, 216, 246, 0.3)', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  color: '#00d8f6', 
                  fontWeight: 800, 
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.8rem',
                  boxShadow: '0 0 12px rgba(0, 216, 246, 0.15)',
                  alignSelf: 'flex-start'
                }}>
                  <span>🚀</span> {language === 'pt' ? 'Lançamento / Pré-Venda' : 'New Release / Pre-Order'}
                </div>
              )}
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', lineHeight: 1.2, fontWeight: 800 }}>{translateProductDisplay(product.name)}</h1>

              {(() => {
                const numId = String(product.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const reviewsCount = (numId % 18) + 7;
                const rating = (4.8 + (numId % 3) / 10).toFixed(1);

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCD34D', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" />
                    </div>
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                      {rating} | {reviewsCount} {t('product_reviews_count')} |
                      <a
                        href={`https://wa.me/${pricingConfig?.whatsAppNumber || '17788061419'}?text=Olá! Tenho uma dúvida sobre o produto: ${product.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-color)', marginLeft: '0.5rem', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {t('product_ask_question')}
                      </a>
                    </span>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-color)' }}>{formatPrice(currentTotal)}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('product_price_transfer')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(currentTotal + 50)}</span>
                </div>
              </div>
            </div>

            {/* Stock Badge - Pronta Entrega */}
            {product.inventory?.[selectedSize] > 0 && !product.coming_soon && (
              <div
                className="pulse-soft"
                style={{
                  background: 'rgba(204, 255, 0, 0.05)',
                  border: '1px solid rgba(204, 255, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{
                  background: 'var(--accent-color)',
                  color: '#000',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>⚡</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent-color)', fontSize: '0.95rem', textTransform: 'uppercase' }}>{t('product_ready_delivery')}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.8 }}>
                    {t('product_stock_units').replace('{count}', product.inventory[selectedSize])}
                  </p>
                </div>
              </div>
            )}

            {/* Sizes Selection */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('product_size')}: <span style={{ color: 'var(--accent-color)' }}>{selectedSize}</span>
                </p>
                <div
                  onClick={() => setIsSizeGuideOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #666' }}
                >
                  📏 {t('product_size_guide')}
                </div>
              </div>

              <div className="size-box-grid">
                {availableSizes.map(s => {
                  const stock = product.inventory?.[s] || 0;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedSize(s);
                        trackEvent('Selecionou tamanho', { size: s, content_name: product.name, content_ids: [product.id] });
                      }}
                      className={`size-box ${selectedSize === s ? 'selected' : ''}`}
                      style={{ position: 'relative' }}
                    >
                      {s}
                      {stock > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'var(--accent-color)',
                          color: '#000',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                        }}>⚡</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!isKids && !isBaby && !isShoes && !isNba && !isStreetwear && (
                <div style={{
                  marginTop: '0.8rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                  color: 'var(--text-muted)'
                }}>
                  {t('product_size_tip')}
                </div>
              )}

              {/* Stock Summary */}
              {Object.values(product.inventory || {}).some(v => v > 0) && !product.coming_soon && (
                <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-color)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={14} /> {t('product_stock_sizes_available')}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {sizes.filter(s => product.inventory?.[s] > 0).map(s => (
                        <span key={s} style={{ background: 'var(--accent-color)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {s} ({product.inventory[s]})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={12} /> {t('product_stock_preorder')}
                    </p>
                    <p style={{ margin: '0.3rem 0 0 1.2rem', fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                      {sizes.filter(s => !(product.inventory?.[s] > 0)).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {['2XL', '3XL', '4XL'].includes(selectedSize) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.5rem', fontWeight: 600 }}>
                  {t('product_plus_size_alert')}
                </p>
              )}
            </div>

            {/* Composição Toggle (Apenas para Infantil) */}
            {isKids && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  {t('product_composition') || 'Itens Inclusos'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setOnlyShirt(false)}
                    style={{
                      flex: 1, border: `1px solid ${!onlyShirt ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      background: !onlyShirt ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                      padding: '0.75rem', color: !onlyShirt ? 'var(--accent-color)' : 'var(--text-main)',
                      borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t('product_composition_full') || 'Kit Completo (Camisa + Calção)'}
                  </button>
                  <button
                    onClick={() => setOnlyShirt(true)}
                    style={{
                      flex: 1, border: `1px solid ${onlyShirt ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      background: onlyShirt ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                      padding: '0.75rem', color: onlyShirt ? 'var(--accent-color)' : 'var(--text-main)',
                      borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t('product_composition_only_shirt') || 'Apenas Camisa'}
                  </button>
                </div>
              </div>
            )}

            {/* Customization Toggle */}
            {!product.coming_soon && !isShoes && !isStreetwear && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('product_customization')}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setIsCustomized(false)}
                      style={{
                        flex: 1, border: `1px solid ${!isCustomized ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: !isCustomized ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                        padding: '0.75rem', color: !isCustomized ? 'var(--accent-color)' : 'var(--text-main)',
                        borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                      }}
                    >
                      {t('product_customization_none')}
                    </button>
                    <button
                      onClick={() => setIsCustomized(true)}
                      style={{
                        flex: 1, border: `1px solid ${isCustomized ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: isCustomized ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                        padding: '0.75rem', color: isCustomized ? 'var(--accent-color)' : 'var(--text-main)',
                        borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                      }}
                    >
                      {t('product_customization_yes')}
                    </button>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {isCustomized && (
                  <div style={{ marginBottom: '2.5rem', background: 'var(--surface-color)', padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>{t('product_custom_name')}</label>
                      <input
                        type="text"
                        placeholder="Ex: NEYMAR JR"
                        value={customName}
                        onChange={e => setCustomName(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>{t('product_custom_number')}</label>
                      <input
                        type="text"
                        placeholder="10"
                        maxLength="2"
                        value={customNumber}
                        onChange={e => setCustomNumber(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* Extra Customization Toggle */}
                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Personalização Extra (+ $6.90)
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setIsExtraCustomized(false)}
                      style={{
                        flex: 1, border: `1px solid ${!isExtraCustomized ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: !isExtraCustomized ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                        padding: '0.75rem', color: !isExtraCustomized ? 'var(--accent-color)' : 'var(--text-main)',
                        borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                      }}
                    >
                      Não
                    </button>
                    <button
                      onClick={() => setIsExtraCustomized(true)}
                      style={{
                        flex: 1, border: `1px solid ${isExtraCustomized ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: isExtraCustomized ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                        padding: '0.75rem', color: isExtraCustomized ? 'var(--accent-color)' : 'var(--text-main)',
                        borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                      }}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {isExtraCustomized && (
                  <div style={{ marginBottom: '2.5rem', background: 'var(--surface-color)', padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Nome Extra (Ex: iFooty Canadá)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: IFOOTY CANADA"
                        value={customExtraName}
                        onChange={e => setCustomExtraName(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Sneaker Sizing Tips */}
            {isShoes && (
              <div style={{ 
                background: 'rgba(204, 255, 0, 0.03)', 
                border: '1px dashed var(--accent-color)', 
                borderRadius: '8px', 
                padding: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💡 {language === 'pt' ? 'Dicas de Ajuste para Chuteiras:' : 'Cleats Sizing Tips:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <li>{language === 'pt' ? 'Chuteiras geralmente têm meio número maior.' : 'Cleats generally run half a size larger.'}</li>
                  <li>{language === 'pt' ? 'Escolha meio número acima se você tiver pés largos ou grossos.' : 'Choose half a size up if you have wide or thick feet.'}</li>
                </ul>
              </div>
            )}

            {/* Qty and Buy OR Pre-Order Button */}
            {product.coming_soon ? (
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => setIsInterestModalOpen(true)} 
                  style={{ 
                    flex: 1, 
                    fontWeight: 900, 
                    fontSize: '1.1rem', 
                    height: '56px', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    background: 'linear-gradient(135deg, #00d8f6 0%, #00b0ff 100%)',
                    color: '#000',
                    border: 'none',
                    boxShadow: '0 0 20px rgba(0, 216, 246, 0.4)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                >
                  {t('product_coming_soon') || 'Tenho Interesse (Pré-Venda)'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <button onClick={() => {
                    const newQty = Math.max(1, quantity - 1);
                    if (newQty !== quantity) {
                      setQuantity(newQty);
                      trackEvent('Selecionou quantidade', { quantity: newQty, content_name: product.name, content_ids: [product.id] });
                    }
                  }} style={{ width: '40px', height: '56px', background: 'transparent', color: '#fff', fontSize: '1.2rem' }}>-</button>
                  <span style={{ width: '30px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                  <button onClick={() => {
                    const newQty = quantity + 1;
                    setQuantity(newQty);
                    trackEvent('Selecionou quantidade', { quantity: newQty, content_name: product.name, content_ids: [product.id] });
                  }} style={{ width: '40px', height: '56px', background: 'transparent', color: '#fff', fontSize: '1.2rem' }}>+</button>
                </div>
                <button className="btn-primary" onClick={() => handleAdd(true)} style={{ flex: 1, fontWeight: 900, fontSize: '1rem', height: '56px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('product_buy_now')}
                </button>
              </div>
            )}


          </div>

        </div>
      </section>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        isShoes={isShoes}
        isNba={isNba}
        isStreetwear={isStreetwear}
      />

      {/* 8. PROVA SOCIAL */}
      <section className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{t('product_social_title')}</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '1.2rem' }}>
          {t('product_social_subtitle_part1')}
          <strong style={{ color: 'var(--accent-color)' }}>+400 {language === 'pt' ? 'clientes' : 'customers'}</strong>
          {t('product_social_subtitle_part2')}
        </p>

        {testimonials.length > 0 ? (
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '5rem' }}>
            {testimonials.map(t => (
              <div key={t.id} className="reveal delay-1 glass-panel" style={{ padding: '2rem', textAlign: 'left', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                <Quote size={40} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--accent-color)', opacity: 0.15 }} />
                <div style={{ color: '#FCD34D', marginBottom: '1rem', display: 'flex', gap: '2px' }}>
                  {Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p style={{ fontSize: '1.05rem', marginBottom: '1.2rem', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-main)' }}>"{t.content}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, color: 'var(--accent-color)' }}>— {t.name}{t.location ? `, ${t.location}` : ''}</p>
                  {t.date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-CA', { month: 'short', year: 'numeric' })}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Simplified placeholders translated via logic above or just generic */}
          </div>
        )}
      </section>

      {/* 10. FAQ */}
      <section className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', borderTop: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>{t('product_faq_title')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {Array.isArray(t('faqs')) && t('faqs').map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* 11. GARANTIA */}
      <section className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', marginTop: '2rem', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <CheckCircle2 size={48} color="#10B981" />
          <h2 style={{ fontSize: '2.5rem' }}>{t('product_cta_secure')}</h2>
          <p className="text-muted" style={{ fontSize: '1.2rem' }}>{t('product_cta_guarantee')}</p>
        </div>
      </section>

      {/* Launch Interest Modal */}
      {isInterestModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '480px', padding: '2rem',
            borderRadius: '16px', background: 'rgba(31, 41, 55, 0.95)',
            border: '1px solid rgba(0, 216, 246, 0.3)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0, 216, 246, 0.1)',
            position: 'relative',
            animation: 'fadeInUp 0.3s forwards'
          }}>
            <button
              onClick={() => {
                setIsInterestModalOpen(false);
                setInterestSuccess(false);
              }}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1.2rem'
              }}
            >
              ✕
            </button>

            {!interestSuccess ? (
              <form onSubmit={handleInterestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                  {t('interest_modal_title')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {t('interest_modal_subtitle')}
                </p>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    {t('interest_name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'pt' ? 'Seu nome completo' : 'Your full name'}
                    value={interestName}
                    onChange={e => setInterestName(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    {t('interest_whatsapp_label')}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 403 123 4567"
                    value={interestWhatsapp}
                    onChange={e => setInterestWhatsapp(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    {t('interest_size_label')}
                  </label>
                  <select
                    value={selectedSize}
                    onChange={e => setSelectedSize(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(31, 41, 55, 0.95)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                  >
                    {availableSizes.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingInterest}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '1rem', fontWeight: 900,
                    background: 'linear-gradient(135deg, #00d8f6 0%, #00b0ff 100%)',
                    color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.95rem'
                  }}
                >
                  {isSubmittingInterest ? (language === 'pt' ? 'Enviando...' : 'Submitting...') : t('interest_submit')}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <CheckCircle2 size={40} />
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {t('interest_success_title')}
                </h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>
                  {t('interest_success_msg')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', marginTop: '0.5rem' }}>
                  <button
                    onClick={handleInterestWhatsAppClick}
                    className="btn-primary"
                    style={{
                      width: '100%', padding: '1rem', fontWeight: 900,
                      background: '#25D366', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem'
                    }}
                  >
                    💬 {t('interest_success_whatsapp')}
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsInterestModalOpen(false);
                      setInterestSuccess(false);
                    }}
                    style={{
                      width: '100%', padding: '0.8rem', background: 'transparent',
                      color: 'var(--text-muted)', border: '1px solid var(--border-color)',
                      borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                    }}
                  >
                    {language === 'pt' ? 'Fechar' : 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductPage;
