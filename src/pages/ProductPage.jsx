import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

import { brasil2025Products } from '../data/brasil2025';
import {
  ShieldCheck, Truck, Star, CheckCircle2, ChevronDown, ChevronUp, Quote
} from 'lucide-react';

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


  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  // Gallery Logic
  const [activeImage, setActiveImage] = useState('');

  // Form Customization Options
  const [selectedSize, setSelectedSize] = useState('M');
  const sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadData() {
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

      if (id.startsWith('br25_')) {
        const p = brasil2025Products.find(x => x.id === id);
        if (p) {
          setProduct(p);
          setActiveImage(p.image);
        }
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

    // Load approved testimonials from Supabase
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

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.5rem', color: 'var(--text-muted)' }}>{language === 'pt' ? 'Carregando produto...' : 'Loading product...'}</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: '5rem' }}>{language === 'pt' ? 'Produto não encontrado.' : 'Product not found.'}</div>;


  const handleAdd = (buyNow = false) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, { nameNumber: isCustomized, customName, customNumber });
    }
    if (buyNow) navigate('/checkout');
  };

  const basePrice = product.price || 47.90;
  let currentTotal = basePrice;
  if (['2XL', '3XL'].includes(selectedSize)) currentTotal += pricingConfig?.size2XL3XL || 7.00;
  if (selectedSize === '4XL') currentTotal += pricingConfig?.size4XL || 10.00;
  if (isCustomized) currentTotal += pricingConfig?.nameNumber || 12.00;

  return (
    <div style={{ paddingBottom: '5rem', minHeight: '100vh' }}>

      <section className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="checkout-grid">

          {/* Lado Esquerdo - Galeria */}
          <div className="gallery-layout" style={{ position: 'relative' }}>
            {/* Desktop Thumbs */}
            <div className="gallery-thumbs desktop-only">
              {product.gallery?.map((img, i) => (
                <img
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

            {/* Desktop Main Image / Mobile Carousel */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* MOBILE CAROUSEL */}
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
                  <img key={i} src={img} alt="" />
                ))}
              </div>
              
              {/* CAROUSEL DOTS (Mobile) */}
              <div className="carousel-dots">
                {product.gallery?.map((_, i) => (
                  <div key={i} className={`dot ${product.gallery[i] === activeImage ? 'active' : ''}`} />
                ))}
              </div>

              {/* DESKTOP MAIN */}
              <div className="desktop-only" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '1rem' }}>
                <img 
                  src={activeImage} 
                  alt={product.name} 
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }} 
                />
              </div>
            </div>
          </div>

          {/* Lado Direito - Form de Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0', minWidth: 0 }}>
            
            {/* Breadcrumbs & Title Segment (Mobile Optimized) */}
            <div className="mobile-only">
              <div className="mobile-breadcrumbs">Início &gt; {product.category || 'Produtos'} &gt; {translateProductDisplay(product.name)}</div>
              <h1 className="mobile-product-title">{translateProductDisplay(product.name)}</h1>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SKU: {product.id}</div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>${currentTotal.toFixed(2)} CAD</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>{language === 'pt' ? 'Frete grátis para todo o Canadá' : 'Free shipping to all Canada'}</div>
              </div>
            </div>

            {/* Desktop Only Header Info */}
            <div className="desktop-only" style={{ flexDirection: 'column' }}>
              <div style={{ background: '#1f2937', color: '#fff', padding: '0.8rem 1rem', borderRadius: '4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', width: '100%', lineHeight: 1.4 }}>
                {language === 'pt' ? '🚀 Desconto progressivo: na compra de 2 ou mais camisas você economiza! 🚀' : '🚀 Volume discount: buy 2 or more jerseys and save! 🚀'}
              </div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', lineHeight: 1.2, fontWeight: 800 }}>{translateProductDisplay(product.name)}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCD34D', marginBottom: '1.5rem' }}>
                <Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" />
                <span className="text-muted" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> | 1 {language === 'pt' ? 'Avaliações' : 'Reviews'} | 0 {language === 'pt' ? 'Perguntas' : 'Questions'}</span>
              </div>
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

            {/* Sizes Selection (ifutz Box Style) */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('product_size')}: <span style={{ color: 'var(--accent-color)' }}>{selectedSize}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #666' }}>
                   📏 {language === 'pt' ? 'GUIA DE MEDIDAS' : 'SIZE GUIDE'}
                </div>
              </div>
              
              <div className="size-box-grid">
                {sizes.map(s => {
                  const isPlus = ['2XL', '3XL', '4XL'].includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`size-box ${selectedSize === s ? 'selected' : ''}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {['2XL', '3XL', '4XL'].includes(selectedSize) && (
                 <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.5rem', fontWeight: 600 }}>
                   {language === 'pt' ? '* Tamanho Plus Size selecionado' : '* Plus Size selected'}
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

            {/* Conditional Inputs (Personalizacao) */}
            {isCustomized && (
              <div style={{ marginBottom: '2.5rem', background: 'var(--surface-color)', padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>NOME</label>
                  <input
                    type="text"
                    placeholder="Ex: NEYMAR JR"
                    value={customName}
                    onChange={e => setCustomName(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>NÚMERO</label>
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

            {/* Price Table (Desktop Only - simplified) */}
            <div className="desktop-only">
              {pricingConfig?.discounts && pricingConfig.discounts.length > 0 && (
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
                  <p style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.8rem', fontSize: '0.95rem' }}>{t('product_wholesale_table')}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.3rem', borderBottom: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                      <span>1 peça</span>
                      <span style={{ fontWeight: 600 }}>${basePrice.toFixed(2)} unit.</span>
                    </div>
                    {[...pricingConfig.discounts].sort((a, b) => a.qty - b.qty).map((d, index) => {
                      const pricePerUnit = basePrice * (1 - (d.percent || 0) / 100);
                      const qtyLabel = d.qty === 3 ? "3-4 peças" : d.qty === 5 ? "5-9 peças" : d.qty === 10 ? "10+ peças" : `${d.qty} peças`;
                      return (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.3rem', borderBottom: index < pricingConfig.discounts.length - 1 ? '1px dashed var(--border-color)' : 'none', color: '#10B981', fontWeight: 600 }}>
                          <span>{language === 'pt' ? qtyLabel : qtyLabel.replace('peças', 'jerseys').replace('peça', 'jersey')}</span>
                          <span>${pricePerUnit.toFixed(2)} {t('product_wholesale_each')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Medidas Table */}
            <div style={{ background: 'var(--surface-color)', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📏 {language === 'pt' ? 'Guia de Medidas Oficial' : 'Official Size Guide'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.8rem', background: 'var(--surface-hover)', borderBottom: '2px solid var(--accent-color)' }}></th>
                    <th style={{ padding: '0.8rem', background: 'var(--surface-hover)', borderBottom: '2px solid var(--accent-color)' }}>P (S)</th>
                    <th style={{ padding: '0.8rem', background: 'var(--surface-hover)', borderBottom: '2px solid var(--accent-color)' }}>M</th>
                    <th style={{ padding: '0.8rem', background: 'var(--surface-hover)', borderBottom: '2px solid var(--accent-color)' }}>G (L)</th>
                    <th style={{ padding: '0.8rem', background: 'var(--surface-hover)', borderBottom: '2px solid var(--accent-color)' }}>GG (XL)</th>
                    <th style={{ padding: '0.8rem', background: 'var(--surface-hover)', borderBottom: '2px solid var(--accent-color)' }}>XG (2XL)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.8rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{language === 'pt' ? 'COMPRIMENTO' : 'LENGTH'}</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>69-71 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>71-73 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>73-78 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>75-78 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>78-81 cm</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.8rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{language === 'pt' ? 'LARGURA' : 'WIDTH'}</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>53-55 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>55-57 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>57-58 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>58-60 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>60-62 cm</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.8rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{language === 'pt' ? 'ALTURA IND.' : 'SUGGESTED HEIGHT'}</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>162-170 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>170-176 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>176-182 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>182-190 cm</td>
                    <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>190-195 cm</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.8rem', fontWeight: 600 }}>{language === 'pt' ? 'PESO IND.' : 'SUGGESTED WEIGHT'}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>50-62 kg</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>62-78 kg</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>78-83 kg</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>83-90 kg</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>90-97 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </section>

      {/* 8. PROVA SOCIAL */}
      <section className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>O que nossos clientes dizem</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '1.2rem' }}>Já somos <strong style={{ color: 'var(--accent-color)' }}>+200 clientes</strong> vestindo a paixão no Canadá! 🍁</p>
        {testimonials.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {testimonials.map(t => (
              <div key={t.id} className="glass-panel" style={{ padding: '2rem', textAlign: 'left', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                <Quote size={40} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--accent-color)', opacity: 0.15 }} />
                <div style={{ color: '#FCD34D', marginBottom: '1rem', display: 'flex', gap: '2px' }}>
                  {Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p style={{ fontSize: '1.05rem', marginBottom: '1.2rem', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-main)' }}>"{ t.content }"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, color: 'var(--accent-color)' }}>— {t.name}{t.location ? `, ${t.location}` : ''}</p>
                  {t.date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', borderRadius: '12px' }}>
              <div style={{ color: '#FCD34D', marginBottom: '1rem', display: 'flex', gap: '2px' }}><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
              <p style={{ fontSize: '1.05rem', marginBottom: '1.2rem', fontStyle: 'italic', lineHeight: 1.6 }}>"Qualidade absurda, parece original! Cheguei em Toronto e todos perguntaram onde comprei."</p>
              <p style={{ fontWeight: 700, color: 'var(--accent-color)' }}>— Ricardo T., Toronto</p>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', borderRadius: '12px' }}>
              <div style={{ color: '#FCD34D', marginBottom: '1rem', display: 'flex', gap: '2px' }}><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
              <p style={{ fontSize: '1.05rem', marginBottom: '1.2rem', fontStyle: 'italic', lineHeight: 1.6 }}>"Chegou rápido e a personalização ficou incrível! Recomendo demais."</p>
              <p style={{ fontWeight: 700, color: 'var(--accent-color)' }}>— Fernando S., Vancouver</p>
            </div>
          </div>
        )}
      </section>

      {/* 10. FAQ */}
      <section className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', borderTop: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>Perguntas Frequentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <FAQItem question="As camisas são originais?" answer="São camisas de alta qualidade estilo jogador, com acabamento premium idêntico." />
          <FAQItem question="Vocês entregam em todo o Canadá?" answer="Sim, enviamos para todas as províncias e cidades do Canadá com rastreamento." />
          <FAQItem question="O pagamento é seguro?" answer="100% Seguro. Utilizamos gateways certificados e operamos preferencialmente e-Transfer para residentes canadenses." />
        </div>
      </section>

      {/* 11. GARANTIA */}
      <section className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', marginTop: '2rem', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <CheckCircle2 size={48} color="#10B981" />
          <h2 style={{ fontSize: '2.5rem' }}>Compra Segura</h2>
          <p className="text-muted" style={{ fontSize: '1.2rem' }}>Garantimos a qualidade do produto e suporte completo ao cliente via WhatsApp.</p>
        </div>
      </section>

    </div>
  );
};

export default ProductPage;
