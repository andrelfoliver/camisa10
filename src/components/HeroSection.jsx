import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import StatCounter from './StatCounter';

const HeroSection = () => {
  const { t } = useLanguage();
  const DEFAULT_HEROES = [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2036&auto=format&fit=crop', // Estádio épico
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070&auto=format&fit=crop', // Bola e campo
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop'  // Emoção no estádio
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [heroImages, setHeroImages] = useState([]); // Inicia vazio para evitar flash

  useEffect(() => {
    async function loadHeroSlides() {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'hero_slides')
          .single();

        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHeroImages(parsed);
            return;
          }
        }
        // Se chegar aqui, o banco retornou vazio, usamos o fallback
        setHeroImages(DEFAULT_HEROES);
      } catch (e) {
        setHeroImages(DEFAULT_HEROES);
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
      {/* Background Slides - Otimizado para carregar apenas o ativo */}
      {heroImages.length > 0 && (
        <div
          key={heroImages[currentIndex]}
          className="hero-slide-bg active"
          style={{ backgroundImage: `url('${heroImages[currentIndex]}')` }}
        />
      )}

      {/* Overlay fixo para contraste */}
      <div className="hero-overlay-static"></div>

      <div className="hero-container-modern animate-fade-in">

        {/* Social Proof no topo à direita - Fixo */}
        <div className="hero-social-proof-top">
          <div className="social-proof-avatars">
            <img src="/avatar_front.png" alt="Client" />
            <img src="/avatar_side.png" alt="Client" />
            <img src="/avatar_34.png" alt="Client" />
            <div className="avatar-more">+</div>
          </div>
          <div className="social-proof-content">
            <span className="social-proof-number">+<StatCounter target={200} variant="simple" duration={2000} /></span>
            <span className="social-proof-label">{t('hero_satisfied_clients').replace('⭐ +250 ', '')}</span>
          </div>
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
