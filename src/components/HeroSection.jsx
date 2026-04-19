import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';

const HeroSection = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    async function loadHeroSlides() {
      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'hero_slides')
        .single();
      
      if (data && data.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHeroImages(parsed);
          }
        } catch (e) {
          console.error("Erro ao processar hero_slides:", e);
        }
      }
    }
    loadHeroSlides();
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000); // 6 segundos para cada craque
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <section className="hero-funnel">
      {/* Background Slides */}
      {heroImages.map((src, index) => (
        <div 
          key={src}
          className={`hero-slide-bg ${index === currentIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      ))}
      
      {/* Overlay fixo para contraste */}
      <div className="hero-overlay-static"></div>

      <div className="hero-container-modern animate-fade-in">
        
        {/* Social Proof no topo à direita - Fixo */}
        <div className="hero-social-proof-top">
          {t('hero_satisfied_clients')}
        </div>

        {/* Content Box - Fixo */}
        <div className="hero-zone-west">
          <h1 className="hero-giant-title">
            {t('hero_title_part1')}
            <span style={{ color: 'var(--accent-color)' }}>{t('hero_title_accent')}</span>
          </h1>

          <p className="hero-subtitle-modern">
            {t('hero_subtitle')}
          </p>

          {/* Trust Badges */}
          <div className="hero-trust-badges">
            <div className="badge-trust-item">
              <Truck size={24} color="var(--accent-color)" />
              <div className="badge-trust-text">
                <span className="badge-trust-title">{t('hero_shipping_all')}</span>
                <span className="badge-trust-desc">{t('hero_shipping_calgary')}</span>
              </div>
            </div>
            <div className="badge-trust-item">
              <ShieldCheck size={24} color="var(--accent-color)" />
              <div className="badge-trust-text">
                <span className="badge-trust-title">{t('hero_shipping_guaranteed')}</span>
                <span className="badge-trust-desc">{t('hero_shipping_moneyback')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="hero-actions-strategic">
            <a href="#catalogo" className="btn-hero-strategic-primary">
              {t('hero_btn_guarantee')}
            </a>
            <a href="#catalogo" className="btn-hero-strategic-secondary">
              {t('hero_btn_view_all')}
            </a>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="hero-carousel-dots">
          {heroImages.map((_, i) => (
            <button 
              key={i} 
              className={`dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      </div>

      <div className="hero-decor-line"></div>
    </section>
  );
};

export default HeroSection;
