import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

import { brasil2025Products } from '../data/brasil2025';
import {
  ShieldCheck, Truck, Star, CheckCircle2, ChevronDown, ChevronUp, Quote
} from 'lucide-react';
import SizeGuideModal from '../components/SizeGuideModal';
import ProductMedia from '../components/ProductMedia';

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
  const { t, language, translateProductDisplay } = useLanguage();
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);


  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  // Gallery Logic
  const [activeImage, setActiveImage] = useState('');

  // Form Customization Options
  const [selectedSize, setSelectedSize] = useState('M');
  
  // Lógica dinâmica para definir quais tamanhos exibir
  const isKids = product?.category?.toLowerCase().includes('infantil') || 
                 product?.name?.toLowerCase().includes('infantil') || 
                 product?.name?.toLowerCase().includes('kids');
  const sizes = isKids 
    ? ['16', '18', '20', '22', '24', '26', '28'] 
    : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  const availableSizes = sizes.filter(s => !product?.unavailable_sizes?.includes(s));

  // Ajusta o tamanho selecionado inicial se for infantil ou se o padrão estiver bloqueado
  useEffect(() => {
    if (isKids && !['16', '18', '20', '22', '24', '26', '28'].includes(selectedSize)) {
      const firstAvailable = availableSizes[0] || '20';
      setSelectedSize(firstAvailable);
    } else if (product?.unavailable_sizes?.includes(selectedSize)) {
      // Se o tamanho padrão estiver bloqueado, pega o primeiro disponível
      const firstAvailable = availableSizes[0] || (isKids ? '20' : 'M');
      setSelectedSize(firstAvailable);
    }
  }, [isKids, product]);

  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadData() {
      // Logic for dummy product IDs (preserved)
      if (id.startsWith('q')) {
        const p = {
          q1: { id: 'q1', name: 'Brasil Titular 25/26 (Torcedor)', category: 'Seleção Brasileira', price: 44.90, image: '/catalog/shirt_188.jpg', gallery: ['/catalog/shirt_188.jpg'] },
          q2: { id: 'q2', name: 'Brasil Titular 25/26 (Jogador)', category: 'Seleção Brasileira', price: 69.90, image: '/catalog/shirt_183.jpg', gallery: ['/catalog/shirt_183.jpg'] },
          q3: { id: 'q3', name: 'Brasil Reserva 25/26', category: 'Seleção Brasileira', price: 44.90, image: '/catalog/shirt_165.jpg', gallery: ['/catalog/shirt_165.jpg'] },
          q4: { id: 'q4', name: 'Brasil Feminina Titular/Reserva', category: 'Feminina', price: 44.90, image: '/catalog/shirt_344.jpg', gallery: ['/catalog/shirt_344.jpg'] }
        }[id];
        setProduct(p);
        setActiveImage(p.image);
        setLoading(false);
        return;
      }

      if (id.startsWith('geral_')) {
        const idx = parseInt(id.replace('geral_', ''));
        const p = {
          id: `geral_${idx}`,
          name: `Camisa Torcedor/Geral #${idx}`,
          image: `/camisas/@carinhacriativo (${idx}).png`,
          gallery: [`/camisas/@carinhacriativo (${idx}).png`],
          price: 69.90
        };
        setProduct(p);
        setActiveImage(p.image);
        setLoading(false);
        return;
      }

      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setProduct({ ...data, gallery: data.gallery && data.gallery.length > 0 ? data.gallery : [data.image] });
        setActiveImage(data.image);
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


  const handleAdd = (buyNow = false) => {
    // Busca a primeira imagem que NÃO seja vídeo para usar como thumbnail na sacola
    const isVideo = (url) => url?.toLowerCase().endsWith('.mp4');
    let displayImage = product.image;
    
    if (isVideo(displayImage)) {
      displayImage = product.gallery?.find(img => !isVideo(img)) || '/placeholder.jpg';
    }

    const productWithFix = { ...product, image: displayImage };

    for (let i = 0; i < quantity; i++) {
      addToCart(productWithFix, selectedSize, { nameNumber: isCustomized, customName, customNumber });
    }
    if (buyNow) navigate('/checkout');
  };

   const basePrice = Number(product.price) || 47.90;
   let currentTotal = basePrice;
   if (['2XL', '3XL'].includes(selectedSize)) currentTotal += Number(pricingConfig?.size2XL3XL || 7.00);
   if (selectedSize === '4XL') currentTotal += Number(pricingConfig?.size4XL || 10.00);
   if (isCustomized) currentTotal += Number(pricingConfig?.nameNumber || 12.00);

  return (
    <div style={{ paddingBottom: '5rem', minHeight: '100vh' }}>

      <section className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="checkout-grid">

          {/* Lado Esquerdo - Galeria */}
          <div className="gallery-layout" style={{ position: 'relative' }}>
            <div className="gallery-thumbs desktop-only">
              {product.gallery?.map((img, i) => (
                <ProductMedia
                  key={i}
                  src={img}
                  alt={`Gallery ${i}`}
                  style={{
                    width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer',
                    border: activeImage === img ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    borderRadius: '8px', background: 'var(--surface-color)'
                  }}
                  onClick={() => setActiveImage(img)}
                />
              ))}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div 
                className="mobile-product-carousel"
                onScroll={(e) => {
                  const scrollLeft = e.target.scrollLeft;
                  const width = e.target.offsetWidth;
                  const index = Math.round(scrollLeft / width);
                  if(index !== product.gallery?.indexOf(activeImage)) {
                    setActiveImage(product.gallery[index]);
                  }
                }}
              >
                {product.gallery?.map((img, i) => (
                  <ProductMedia key={i} src={img} alt="" />
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
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }} 
                />
              </div>
            </div>
          </div>

          {/* Lado Direito - Form de Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0', minWidth: 0 }}>
            
            <div className="mobile-only">
              <div className="mobile-breadcrumbs">{t('category_home')} &gt; {product.category || t('footer_catalog')} &gt; {translateProductDisplay(product.name)}</div>
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
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>${currentTotal.toFixed(2)} CAD</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>{t('product_free_shipping')}</div>
              </div>
            </div>

            <div className="desktop-only" style={{ flexDirection: 'column' }}>
              <div style={{ background: '#1f2937', color: '#fff', padding: '0.8rem 1rem', borderRadius: '4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', width: '100%', lineHeight: 1.4 }}>
                {t('product_volume_promo')}
              </div>
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
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-color)' }}>${currentTotal.toFixed(2)} CAD</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('product_price_transfer')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${(currentTotal + 50).toFixed(2)} CAD</span>
                </div>
              </div>
            </div>
            
            {/* Stock Badge - Pronta Entrega */}
            {product.inventory?.[selectedSize] > 0 && (
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
                      onClick={() => setSelectedSize(s)}
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

              {/* Stock Summary */}
              {Object.values(product.inventory || {}).some(v => v > 0) && (
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

            {/* Customization Toggle */}
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

            {/* Qty and Buy */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '40px', height: '56px', background: 'transparent', color: '#fff', fontSize: '1.2rem' }}>-</button>
                <span style={{ width: '30px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} style={{ width: '40px', height: '56px', background: 'transparent', color: '#fff', fontSize: '1.2rem' }}>+</button>
              </div>
              <button className="btn-primary" onClick={() => handleAdd(true)} style={{ flex: 1, fontWeight: 900, fontSize: '1rem', height: '56px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('product_buy_now')}
              </button>
            </div>


            </div>

          </div>
        </section>

      <SizeGuideModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setIsSizeGuideOpen(false)} 
      />

      {/* 8. PROVA SOCIAL */}
      <section className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{t('product_social_title')}</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '1.2rem' }}>
          {t('product_social_subtitle_part1')}
          <strong style={{ color: 'var(--accent-color)' }}>+200 {language === 'pt' ? 'clientes' : 'customers'}</strong>
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
                <p style={{ fontSize: '1.05rem', marginBottom: '1.2rem', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-main)' }}>"{ t.content }"</p>
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

    </div>
  );
};

export default ProductPage;
